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
