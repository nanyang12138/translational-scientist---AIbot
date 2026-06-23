class_name LLMAgentClient
extends RefCounted

const DEFAULT_TIMEOUT := 45.0

func resolve_oracle(root: Node, endpoint: String, oracle: String, game: Dictionary) -> Dictionary:
	var clean_endpoint: String = endpoint.strip_edges()
	if clean_endpoint.is_empty():
		return {
			"ok": false,
			"error": "missing_endpoint",
			"message": "LLM endpoint 不能为空。"
		}

	var http := HTTPRequest.new()
	http.timeout = DEFAULT_TIMEOUT
	root.add_child(http)

	var body := JSON.stringify({
		"oracle": oracle,
		"game": game
	})
	var headers := ["Content-Type: application/json"]
	var error := http.request(clean_endpoint, headers, HTTPClient.METHOD_POST, body)
	if error != OK:
		http.queue_free()
		return {
			"ok": false,
			"error": "request_failed",
			"message": "无法连接 Agent Bridge: %s" % error
		}

	var completed: Array = await http.request_completed
	http.queue_free()

	var status_code: int = int(completed[1])
	var response_body: PackedByteArray = completed[3]
	var text: String = response_body.get_string_from_utf8()
	if status_code < 200 or status_code >= 300:
		return {
			"ok": false,
			"error": "http_error",
			"message": "Agent Bridge 返回 HTTP %d: %s" % [status_code, text.left(240)]
		}

	var parsed = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		return {
			"ok": false,
			"error": "invalid_json",
			"message": "Agent Bridge 没有返回 JSON。"
		}

	return parsed


func resolve_oracle_direct_openai(root: Node, settings: Dictionary, oracle: String, game: Dictionary) -> Dictionary:
	var base_url: String = String(settings.get("base_url", "https://llm-api.amd.com/OpenAI")).strip_edges()
	var model: String = String(settings.get("model", "gpt-5.5")).strip_edges()
	var subscription_key: String = String(settings.get("subscription_key", "")).strip_edges()
	var user_header: String = String(settings.get("user", "")).strip_edges()
	var placeholder_key: String = String(settings.get("placeholder_key", "placeholder-key")).strip_edges()
	if base_url.is_empty() or model.is_empty() or subscription_key.is_empty():
		return {
			"ok": false,
			"error": "missing_direct_settings",
			"message": "直连 AMD Gateway 需要 base URL、model 和 subscription key。"
		}

	var endpoint: String = _join_url(base_url, "chat/completions")
	var http := HTTPRequest.new()
	http.timeout = DEFAULT_TIMEOUT
	root.add_child(http)

	var body := _build_chat_completion_body(model, oracle, game)
	var headers := [
		"Content-Type: application/json",
		"Authorization: Bearer %s" % (placeholder_key if not placeholder_key.is_empty() else "placeholder-key"),
		"Ocp-Apim-Subscription-Key: %s" % subscription_key
	]
	if not user_header.is_empty():
		headers.append("user: %s" % user_header)

	var error := http.request(endpoint, headers, HTTPClient.METHOD_POST, JSON.stringify(body))
	if error != OK:
		http.queue_free()
		return {
			"ok": false,
			"error": "request_failed",
			"message": "无法请求 AMD/OpenAI Gateway: %s" % error
		}

	var completed: Array = await http.request_completed
	http.queue_free()

	var status_code: int = int(completed[1])
	var response_body: PackedByteArray = completed[3]
	var text: String = response_body.get_string_from_utf8()
	if status_code < 200 or status_code >= 300:
		return {
			"ok": false,
			"error": "http_error",
			"message": "AMD/OpenAI Gateway 返回 HTTP %d: %s" % [status_code, text.left(240)]
		}

	var parsed = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		return {
			"ok": false,
			"error": "invalid_json",
			"message": "AMD/OpenAI Gateway 没有返回 JSON。"
		}

	var content: String = _extract_chat_content(parsed)
	var agent_output = _parse_json_object(content)
	if typeof(agent_output) != TYPE_DICTIONARY:
		return {
			"ok": false,
			"error": "invalid_agent_json",
			"message": "模型回复不是可解析的 agent JSON。"
		}

	agent_output.ok = true
	agent_output.provider = "direct-amd-openai"
	agent_output.model = model
	return agent_output


func _build_chat_completion_body(model: String, oracle: String, game: Dictionary) -> Dictionary:
	var is_gpt5 := model.to_lower().begins_with("gpt-5")
	var body := {
		"model": model,
		"temperature": 1.0 if is_gpt5 else 0.9,
		"max_completion_tokens": 1200,
		"messages": [
			{
				"role": "system",
				"content": "你是《神已离线》的多 agent 导演系统。你必须只输出 JSON。所有文本使用简体中文。不要输出 markdown。"
			},
			{
				"role": "user",
				"content": JSON.stringify({
					"task": "根据玩家神谕生成一轮 agent 叙事。六个 faction_outcomes 必须对应 council/church/merchants/syndicate/revolt/gazette。deltas 只能使用 order/faith/hunger/unrest/secrecy/inequality/freedom/wealth/paranoia/fear,每个数值建议在 -12 到 12。必须包含 headline/director_note/faction_outcomes/rumor/citizen/ui/memories。",
					"oracle": oracle,
					"world_state": {
						"turn": game.get("turn", 0),
						"prophecy": game.get("prophecy", ""),
						"stats": game.get("stats", {}),
						"factions": game.get("factions", []),
						"memories": game.get("memories", [])
					}
				})
			}
		]
	}
	if not is_gpt5:
		body.response_format = {"type": "json_object"}
	return body


func _extract_chat_content(response: Dictionary) -> String:
	var choices = response.get("choices", [])
	if typeof(choices) != TYPE_ARRAY or choices.is_empty():
		return ""
	var first = choices[0]
	if typeof(first) != TYPE_DICTIONARY:
		return ""
	var message = first.get("message", {})
	if typeof(message) != TYPE_DICTIONARY:
		return ""
	return String(message.get("content", ""))


func _parse_json_object(text: String):
	var direct = JSON.parse_string(text)
	if typeof(direct) == TYPE_DICTIONARY:
		return direct
	var start := text.find("{")
	if start < 0:
		return null
	var depth := 0
	var in_string := false
	var escaped := false
	for index in range(start, text.length()):
		var character := text[index]
		if in_string:
			if escaped:
				escaped = false
			elif character == "\\":
				escaped = true
			elif character == "\"":
				in_string = false
			continue
		if character == "\"":
			in_string = true
		elif character == "{":
			depth += 1
		elif character == "}":
			depth -= 1
			if depth == 0:
				return JSON.parse_string(text.substr(start, index - start + 1))
	return null


func _join_url(base_url: String, suffix: String) -> String:
	return "%s/%s" % [base_url.trim_suffix("/"), suffix.trim_prefix("/")]
