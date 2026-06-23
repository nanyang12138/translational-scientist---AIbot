class_name OracleEngine
extends RefCounted

const CONFIG_PATH := "res://data/game_config.json"
const FACTIONS_PATH := "res://data/factions.json"

var config := {}
var factions := []
var topic_labels := {}

func _init() -> void:
	config = _load_json(CONFIG_PATH, {})
	factions = _load_json(FACTIONS_PATH, [])
	for topic_id in config.get("topics", {}).keys():
		topic_labels[topic_id] = config.topics[topic_id].get("label", topic_id)


func new_game(seed_text := "god-is-offline") -> Dictionary:
	var rng := _rng_from_text(seed_text)
	var stats := {}
	for stat_id in config.get("stats", {}).keys():
		stats[stat_id] = int(config.stats[stat_id].get("value", 0))

	var faction_states := []
	for faction in factions:
		faction_states.append({
			"id": faction.id,
			"name": faction.name,
			"color": faction.get("color", "#FFFFFF"),
			"trust": _bounded(42 + int(rng.randf() * 18.0)),
			"heat": _bounded(25 + int(rng.randf() * 22.0))
		})

	return {
		"seed": seed_text,
		"turn": 0,
		"city_name": config.get("city_name", "圣玻璃城"),
		"prophecy": config.get("default_prophecy", "当圣玻璃城不再需要神时,游戏结束。"),
		"stats": stats,
		"factions": faction_states,
		"memories": [
			"神已离线七年,穹顶下的钟仍每天敲响十三次。",
			"所有阵营都相信控制台存在,但没人知道它是否仍能听见人。"
		],
		"last_outcome": {}
	}


func set_prophecy(game: Dictionary, prophecy: String) -> Dictionary:
	var clean: String = _normalize(prophecy)
	var next: Dictionary = game.duplicate(true)
	if clean.is_empty():
		return next

	next.prophecy = clean
	var memories: Array = next.memories.duplicate(true)
	memories.push_front("终局预言被写入控制台:「%s」" % clean)
	next.memories = memories.slice(0, 8)
	return next


func resolve_oracle(game: Dictionary, oracle_text: String) -> Dictionary:
	var oracle: String = _normalize(oracle_text)
	if oracle.is_empty():
		push_error("神谕不能为空。")
		return game.duplicate(true)

	var topics: Array = detect_topics(oracle)
	var primary_topic: String = "faith" if topics.is_empty() else String(topics[0])
	var ambiguity: int = _calculate_ambiguity(oracle, topics)
	var rng: RandomNumberGenerator = _rng_from_text("%s:%s:%s" % [game.get("seed", "seed"), int(game.get("turn", 0)) + 1, oracle])
	var faction_outcomes: Array = []

	for faction in factions:
		faction_outcomes.append(_interpret_faction(faction, topics, oracle, ambiguity, rng))

	var rumor: Dictionary = _create_rumor_outcome(topics, ambiguity, rng)
	var next_stats: Dictionary = _apply_outcomes(game.stats, faction_outcomes + [rumor])
	var ui: Dictionary = _create_ui_outcome(next_stats, topics, ambiguity)
	var next_factions: Array = _update_factions(game.factions, faction_outcomes, next_stats, rng)
	var citizen: Dictionary = _create_citizen_letter(oracle, primary_topic, next_stats, rng)
	var headline: String = _create_headline(oracle, primary_topic, ambiguity, next_stats)
	var terminal_pressure: Dictionary = _get_terminal_pressure(game.prophecy, next_stats, primary_topic)
	var crisis: Dictionary = _detect_crisis(next_stats)
	var audio_cues: Array = _create_audio_cues(topics, ambiguity, crisis)

	var memories: Array = game.memories.duplicate(true)
	memories.push_front(citizen.summary)
	memories.push_front(headline)
	memories.push_front("第 %d 回合神谕:「%s」" % [int(game.turn) + 1, oracle])

	var next: Dictionary = game.duplicate(true)
	next.turn = int(game.turn) + 1
	next.stats = next_stats
	next.factions = next_factions
	next.memories = memories.slice(0, 10)
	next.last_outcome = {
		"oracle": oracle,
		"topics": topics,
		"ambiguity": ambiguity,
		"headline": headline,
		"faction_outcomes": faction_outcomes,
		"rumor": rumor,
		"ui": ui,
		"citizen": citizen,
		"terminal_pressure": terminal_pressure,
		"crisis": crisis,
		"audio_cues": audio_cues
	}

	return next


func resolve_oracle_with_agent(game: Dictionary, oracle_text: String, agent_output: Dictionary) -> Dictionary:
	var oracle: String = _normalize(oracle_text)
	if oracle.is_empty():
		push_error("神谕不能为空。")
		return game.duplicate(true)
	if agent_output.is_empty() or not bool(agent_output.get("ok", false)):
		return resolve_oracle(game, oracle)

	var topics: Array = detect_topics(oracle)
	var primary_topic: String = "faith" if topics.is_empty() else String(topics[0])
	var ambiguity: int = _calculate_ambiguity(oracle, topics)
	var rng: RandomNumberGenerator = _rng_from_text("%s:%s:%s:llm" % [game.get("seed", "seed"), int(game.get("turn", 0)) + 1, oracle])
	var faction_outcomes: Array = _sanitize_agent_factions(agent_output.get("faction_outcomes", []), oracle)
	var rumor: Dictionary = _sanitize_agent_report(agent_output.get("rumor", {}), "rumor", "谣言群体")
	var next_stats: Dictionary = _apply_outcomes(game.stats, faction_outcomes + [rumor])
	var ui: Dictionary = _sanitize_agent_ui(agent_output.get("ui", {}), next_stats, topics, ambiguity)
	var next_factions: Array = _update_factions(game.factions, faction_outcomes, next_stats, rng)
	var citizen: Dictionary = _sanitize_agent_citizen(agent_output.get("citizen", {}), oracle, primary_topic, next_stats, rng)
	var headline: String = _limit_text(String(agent_output.get("headline", "")), 220)
	if headline.is_empty():
		headline = _create_headline(oracle, primary_topic, ambiguity, next_stats)
	var terminal_pressure: Dictionary = _get_terminal_pressure(game.prophecy, next_stats, primary_topic)
	var crisis: Dictionary = _detect_crisis(next_stats)
	var audio_cues: Array = _create_audio_cues(topics, ambiguity, crisis)

	var memories: Array = game.memories.duplicate(true)
	var generated_memories_raw = agent_output.get("memories", [])
	var generated_memories: Array = generated_memories_raw if typeof(generated_memories_raw) == TYPE_ARRAY else []
	for index in range(min(generated_memories.size(), 6)):
		memories.push_front(_limit_text(String(generated_memories[index]), 180))
	memories.push_front(citizen.summary)
	memories.push_front(headline)
	memories.push_front("第 %d 回合 LLM 神谕:「%s」" % [int(game.turn) + 1, oracle])

	var next: Dictionary = game.duplicate(true)
	next.turn = int(game.turn) + 1
	next.stats = next_stats
	next.factions = next_factions
	next.memories = memories.slice(0, 12)
	next.last_outcome = {
		"oracle": oracle,
		"topics": topics,
		"ambiguity": ambiguity,
		"headline": headline,
		"director_note": _limit_text(String(agent_output.get("director_note", "")), 360),
		"faction_outcomes": faction_outcomes,
		"rumor": rumor,
		"ui": ui,
		"citizen": citizen,
		"terminal_pressure": terminal_pressure,
		"crisis": crisis,
		"audio_cues": audio_cues,
		"llm_enabled": true,
		"llm_provider": String(agent_output.get("provider", "unknown")),
		"llm_model": String(agent_output.get("model", "unknown"))
	}

	return next


func detect_topics(text: String) -> Array:
	var found: Array = []
	var lower: String = text.to_lower()
	for topic_id in config.get("topics", {}).keys():
		for keyword in config.topics[topic_id].get("keywords", []):
			if lower.contains(String(keyword).to_lower()):
				found.append(topic_id)
				break
	return found


func get_stat_label(stat_id: String) -> String:
	return config.get("stats", {}).get(stat_id, {}).get("label", stat_id)


func get_samples() -> Array:
	return config.get("samples", [])


func _interpret_faction(faction: Dictionary, topics: Array, oracle: String, ambiguity: int, rng: RandomNumberGenerator) -> Dictionary:
	var relevant_topic: String = ""
	for topic_id in topics:
		if faction.get("triggers", {}).has(topic_id):
			relevant_topic = topic_id
			break

	var trigger: Dictionary = {}
	if not relevant_topic.is_empty():
		trigger = faction.triggers[relevant_topic]

	var action: String = String(trigger.get("action", faction.get("base_action", "保持沉默并等待局势改变")))
	var deltas: Dictionary = _merge_deltas(faction.get("stat_deltas", {}), trigger.get("deltas", {}))
	var opportunism: int = int(round(float(ambiguity - 35) / 8.0))
	var adjusted: Dictionary = {}
	for key in deltas.keys():
		adjusted[key] = int(deltas[key]) + int(round(float(opportunism) * rng.randf()))

	return {
		"agent_id": faction.id,
		"agent_name": faction.name,
		"color": faction.get("color", "#FFFFFF"),
		"voice": faction.get("voice", ""),
		"interpretation": "「%s」被%s理解为: %s。" % [oracle, faction.name, action if not trigger.is_empty() else faction.get("distortion", action)],
		"action": action,
		"deltas": adjusted,
		"suspicion": _bounded(20 + ambiguity + int(rng.randf() * 24.0))
	}


func _create_rumor_outcome(topics: Array, ambiguity: int, rng: RandomNumberGenerator) -> Dictionary:
	var labels: Array = []
	for topic_id in topics:
		labels.append(topic_labels.get(topic_id, topic_id))
	var label_text: String = "神秘" if labels.is_empty() else "、".join(labels)

	return {
		"agent_id": "rumor",
		"agent_name": "谣言群体",
		"voice": "每个人都只转述自己害怕的那一半。",
		"interpretation": "谣言 agent 把神谕压缩成「%s之夜将至」,并在酒馆、学校和地下礼拜中扩散。" % label_text,
		"action": "制造三个互相矛盾但都足够可信的版本",
		"deltas": {
			"paranoia": int(round(5.0 + float(ambiguity) / 9.0)),
			"unrest": int(round(3.0 + float(ambiguity) / 12.0)),
			"secrecy": int(round(rng.randf() * 5.0))
		},
		"suspicion": _bounded(50 + ambiguity + int(rng.randf() * 15.0))
	}


func _create_ui_outcome(stats: Dictionary, topics: Array, ambiguity: int) -> Dictionary:
	var panels: Array = ["今日新闻", "六大阵营热度", "神谕解释分歧"]

	if topics.has("food") or int(stats.get("hunger", 0)) > 60:
		panels.append("粮仓与黑市价格")
	if topics.has("truth") or int(stats.get("paranoia", 0)) > 55:
		panels.append("影子审判名单")
	if topics.has("equality") or int(stats.get("inequality", 0)) > 62:
		panels.append("阶层冲突图")
	if topics.has("children"):
		panels.append("儿童来信")
	if ambiguity > 62:
		panels.append("失真传播链")

	return {
		"agent_id": "ui",
		"agent_name": "情报官 UI Agent",
		"panels": panels,
		"summary": "UI Agent 判断本轮应展示 %s,因为神谕的歧义指数为 %d。" % ["、".join(panels), ambiguity]
	}


func _sanitize_agent_factions(items, oracle: String) -> Array:
	var by_id: Dictionary = {}
	if typeof(items) == TYPE_ARRAY:
		for item in items:
			if typeof(item) == TYPE_DICTIONARY:
				by_id[String(item.get("agent_id", ""))] = item

	var safe: Array = []
	for faction in factions:
		var item: Dictionary = by_id.get(faction.id, {})
		safe.append({
			"agent_id": faction.id,
			"agent_name": faction.name,
			"color": faction.get("color", "#FFFFFF"),
			"voice": _limit_text(String(item.get("voice", faction.get("voice", ""))), 160),
			"action": _limit_text(String(item.get("action", "%s把神谕改写成自己的行动许可" % faction.name)), 180),
			"interpretation": _limit_text(String(item.get("interpretation", "「%s」被%s解读成一次可利用的政治机会。" % [oracle, faction.name])), 420),
			"deltas": _sanitize_agent_deltas(item.get("deltas", {})),
			"suspicion": _bounded(_safe_int(item.get("suspicion", 52), 52)),
			"memory": _limit_text(String(item.get("memory", "")), 220)
		})
	return safe


func _sanitize_agent_report(source, agent_id: String, agent_name: String) -> Dictionary:
	var item: Dictionary = source if typeof(source) == TYPE_DICTIONARY else {}
	return {
		"agent_id": agent_id,
		"agent_name": _limit_text(String(item.get("agent_name", agent_name)), 50),
		"voice": _limit_text(String(item.get("voice", "每个人都只转述自己害怕的那一半。")), 160),
		"action": _limit_text(String(item.get("action", "制造三个互相矛盾但都足够可信的版本")), 180),
		"interpretation": _limit_text(String(item.get("interpretation", "谣言把神谕拆成互相冲突的版本。")), 420),
		"deltas": _sanitize_agent_deltas(item.get("deltas", {})),
		"suspicion": _bounded(_safe_int(item.get("suspicion", 60), 60))
	}


func _sanitize_agent_deltas(source) -> Dictionary:
	var safe: Dictionary = {}
	if typeof(source) != TYPE_DICTIONARY:
		return safe
	for key in source.keys():
		if not config.get("stats", {}).has(key):
			continue
		safe[key] = clampi(_safe_int(source[key], 0), -18, 18)
	return safe


func _sanitize_agent_ui(source, stats: Dictionary, topics: Array, ambiguity: int) -> Dictionary:
	var item: Dictionary = source if typeof(source) == TYPE_DICTIONARY else {}
	var fallback: Dictionary = _create_ui_outcome(stats, topics, ambiguity)
	var panels: Array = []
	var raw_panels = item.get("panels", fallback.panels)
	if typeof(raw_panels) == TYPE_ARRAY:
		for panel in raw_panels:
			if panels.size() >= 8:
				break
			panels.append(_limit_text(String(panel), 32))
	if panels.is_empty():
		panels = fallback.panels
	return {
		"agent_id": "ui",
		"agent_name": "情报官 UI Agent",
		"panels": panels,
		"summary": _limit_text(String(item.get("summary", fallback.summary)), 240)
	}


func _sanitize_agent_citizen(source, oracle: String, primary_topic: String, stats: Dictionary, rng: RandomNumberGenerator) -> Dictionary:
	var item: Dictionary = source if typeof(source) == TYPE_DICTIONARY else {}
	var fallback: Dictionary = _create_citizen_letter(oracle, primary_topic, stats, rng)
	return {
		"from": _limit_text(String(item.get("from", fallback["from"])), 40),
		"role": _limit_text(String(item.get("role", fallback.role)), 40),
		"summary": _limit_text(String(item.get("summary", fallback.summary)), 160),
		"body": _limit_text(String(item.get("body", fallback.body)), 520)
	}


func _apply_outcomes(stats: Dictionary, outcomes: Array) -> Dictionary:
	var next: Dictionary = stats.duplicate(true)
	for outcome in outcomes:
		for key in outcome.get("deltas", {}).keys():
			next[key] = _bounded(int(next.get(key, 0)) + int(outcome.deltas[key]))
	return next


func _update_factions(current_factions: Array, outcomes: Array, stats: Dictionary, rng: RandomNumberGenerator) -> Array:
	var next: Array = []
	for faction_state in current_factions:
		var outcome: Dictionary = {}
		for candidate in outcomes:
			if candidate.agent_id == faction_state.id:
				outcome = candidate
				break
		var heat_delta: int = int(round(float(outcome.get("suspicion", 35)) / 12.0)) + int(round(float(stats.get("unrest", 0)) / 28.0)) - 2
		var trust_delta: int = int(round(float(int(stats.get("faith", 0)) - int(stats.get("paranoia", 0))) / 24.0)) + int(rng.randf() * 4.0) - 2
		var copy: Dictionary = faction_state.duplicate(true)
		copy.heat = _bounded(int(copy.heat) + heat_delta)
		copy.trust = _bounded(int(copy.trust) + trust_delta)
		next.append(copy)
	return next


func _create_citizen_letter(oracle: String, primary_topic: String, stats: Dictionary, rng: RandomNumberGenerator) -> Dictionary:
	var names: Array = ["伊芙玻璃匠", "莫兰钟表师", "塞拉清道夫", "尼奥旧护士", "阿什门徒", "露卡逃兵", "塔维孤儿", "米娅书记员"]
	var roles: Array = ["送水人", "见习修女", "地下印刷工", "粮仓守夜人", "弃誓士兵", "玻璃校舍学生", "市场账房"]
	var topic_lines: Dictionary = {
		"food": "今天我真的拿到了一小块面包,但给面包的人要我明天替他作证。",
		"truth": "他们让我站到灯下证明自己没有撒谎,可我害怕我的影子比别人长。",
		"equality": "广场上每个人都说自己终于平等,但士兵仍然站在高台上。",
		"death": "有人把死者的名字刻在墙上,然后要求我们继续活得更像旗帜。",
		"children": "学校关门了,老师说这是保护,我不知道保护为什么需要锁。",
		"wealth": "钱币上印着神的眼睛,穷人说那只眼睛从不看他们。",
		"faith": "教堂今天很满,但我听见有人在祈祷你不要再开口。"
	}
	var name: String = String(names[int(rng.randi() % names.size())])
	var role: String = String(roles[int(rng.randi() % roles.size())])
	var crisis: Dictionary = _detect_crisis(stats)

	return {
		"from": name,
		"role": role,
		"summary": "%s写来一封关于「%s」的信。" % [name, oracle],
		"body": "%s 如果这是你的意思,请下一次说得更像人一点。现在城里最重的词是「%s」。" % [topic_lines.get(primary_topic, topic_lines.faith), crisis.label]
	}


func _create_headline(oracle: String, primary_topic: String, ambiguity: int, stats: Dictionary) -> String:
	var topic: String = String(topic_labels.get(primary_topic, "神谕"))
	var crisis: Dictionary = _detect_crisis(stats)
	var prefix: String = "七种译本同时流传" if ambiguity > 60 else "控制台重新发声"
	return "%s: 「%s」引爆%s争夺,%s成为圣玻璃城今日主词。" % [prefix, oracle, topic, crisis.label]


func _detect_crisis(stats: Dictionary) -> Dictionary:
	var crisis_key := ""
	var crisis_value := -1
	for key in stats.keys():
		if int(stats[key]) > crisis_value:
			crisis_key = key
			crisis_value = int(stats[key])
	return {
		"key": crisis_key,
		"value": crisis_value,
		"label": get_stat_label(crisis_key)
	}


func _get_terminal_pressure(prophecy: String, stats: Dictionary, primary_topic: String) -> Dictionary:
	var pressure := 0
	var reasons := []
	var lower := prophecy.to_lower()

	if (lower.contains("平等") or lower.contains("equal")) and int(stats.get("inequality", 0)) < 35:
		pressure += 30
		reasons.append("不平等正在下降,但各阵营开始争夺谁有资格定义平等")
	if (lower.contains("真相") or lower.contains("truth")) and int(stats.get("secrecy", 0)) < 30:
		pressure += 28
		reasons.append("秘密被撕开,城市越来越接近预言里的真相")
	if (lower.contains("不再需要神") or lower.contains("without god")) and int(stats.get("faith", 0)) < 24:
		pressure += 34
		reasons.append("信仰降低,人们开始讨论没有神的制度")
	if primary_topic == "children" and int(stats.get("fear", 0)) > 65:
		pressure += 18
		reasons.append("儿童成为所有阵营向神施压的语言")

	if reasons.is_empty():
		reasons.append("终局预言尚未被明显推进,但世界正在学习你的偏好。")

	return {
		"score": _bounded(pressure),
		"reasons": reasons
	}


func _create_audio_cues(topics: Array, ambiguity: int, crisis: Dictionary) -> Array:
	var cues := ["control_room_drone", "distant_city_rain"]
	if topics.has("faith"):
		cues.append("cathedral_bell")
	if topics.has("death") or int(crisis.value) > 72:
		cues.append("riot_low_rumble")
	if ambiguity > 62:
		cues.append("signal_distortion")
	return cues


func _calculate_ambiguity(text: String, topics: Array) -> int:
	var score := 28
	if text.length() < 12:
		score += 24
	for word in ["应该", "也许", "可能", "希望", "some", "maybe", "should", "might"]:
		if text.to_lower().contains(word):
			score += 14
			break
	score += max(0, 26 - topics.size() * 7)
	if text.contains("?") or text.contains("？"):
		score += 10
	return _bounded(score)


func _merge_deltas(base: Dictionary, extra: Dictionary) -> Dictionary:
	var merged := base.duplicate(true)
	for key in extra.keys():
		merged[key] = int(merged.get(key, 0)) + int(extra[key])
	return merged


func _load_json(path: String, fallback):
	if not FileAccess.file_exists(path):
		push_error("Missing JSON file: %s" % path)
		return fallback
	var file := FileAccess.open(path, FileAccess.READ)
	var parsed = JSON.parse_string(file.get_as_text())
	if parsed == null:
		push_error("Invalid JSON file: %s" % path)
		return fallback
	if typeof(parsed) != typeof(fallback):
		push_error("JSON file has unexpected root type: %s" % path)
		return fallback
	return parsed


func _rng_from_text(text: String) -> RandomNumberGenerator:
	var rng := RandomNumberGenerator.new()
	rng.seed = abs(hash(text))
	return rng


func _normalize(value: String) -> String:
	return value.strip_edges().replace("\n", " ").replace("\t", " ")


func _limit_text(value: String, max_length: int) -> String:
	var clean: String = _normalize(value)
	if clean.length() <= max_length:
		return clean
	return "%s…" % clean.left(max_length - 1)


func _safe_int(value, fallback: int) -> int:
	var value_type := typeof(value)
	if value_type == TYPE_INT:
		return value
	if value_type == TYPE_FLOAT:
		return int(value)
	if value_type == TYPE_STRING and String(value).is_valid_int():
		return int(value)
	return fallback


func _bounded(value: int) -> int:
	return clampi(value, 0, 100)
