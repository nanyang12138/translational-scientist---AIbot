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
	var clean := _normalize(prophecy)
	var next := game.duplicate(true)
	if clean.is_empty():
		return next

	next.prophecy = clean
	var memories := next.memories.duplicate(true)
	memories.push_front("终局预言被写入控制台:「%s」" % clean)
	next.memories = memories.slice(0, 8)
	return next


func resolve_oracle(game: Dictionary, oracle_text: String) -> Dictionary:
	var oracle := _normalize(oracle_text)
	if oracle.is_empty():
		push_error("神谕不能为空。")
		return game.duplicate(true)

	var topics := detect_topics(oracle)
	var primary_topic := "faith" if topics.is_empty() else topics[0]
	var ambiguity := _calculate_ambiguity(oracle, topics)
	var rng := _rng_from_text("%s:%s:%s" % [game.get("seed", "seed"), int(game.get("turn", 0)) + 1, oracle])
	var faction_outcomes := []

	for faction in factions:
		faction_outcomes.append(_interpret_faction(faction, topics, oracle, ambiguity, rng))

	var rumor := _create_rumor_outcome(topics, ambiguity, rng)
	var next_stats := _apply_outcomes(game.stats, faction_outcomes + [rumor])
	var ui := _create_ui_outcome(next_stats, topics, ambiguity)
	var next_factions := _update_factions(game.factions, faction_outcomes, next_stats, rng)
	var citizen := _create_citizen_letter(oracle, primary_topic, next_stats, rng)
	var headline := _create_headline(oracle, primary_topic, ambiguity, next_stats)
	var terminal_pressure := _get_terminal_pressure(game.prophecy, next_stats, primary_topic)
	var crisis := _detect_crisis(next_stats)
	var audio_cues := _create_audio_cues(topics, ambiguity, crisis)

	var memories := game.memories.duplicate(true)
	memories.push_front(citizen.summary)
	memories.push_front(headline)
	memories.push_front("第 %d 回合神谕:「%s」" % [int(game.turn) + 1, oracle])

	var next := game.duplicate(true)
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


func detect_topics(text: String) -> Array:
	var found := []
	var lower := text.to_lower()
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
	var relevant_topic := ""
	for topic_id in topics:
		if faction.get("triggers", {}).has(topic_id):
			relevant_topic = topic_id
			break

	var trigger := {}
	if not relevant_topic.is_empty():
		trigger = faction.triggers[relevant_topic]

	var action := trigger.get("action", faction.get("base_action", "保持沉默并等待局势改变"))
	var deltas := _merge_deltas(faction.get("stat_deltas", {}), trigger.get("deltas", {}))
	var opportunism := int(round(float(ambiguity - 35) / 8.0))
	var adjusted := {}
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
	var labels := []
	for topic_id in topics:
		labels.append(topic_labels.get(topic_id, topic_id))
	var label_text := "神秘" if labels.is_empty() else "、".join(labels)

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
	var panels := ["今日新闻", "六大阵营热度", "神谕解释分歧"]

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


func _apply_outcomes(stats: Dictionary, outcomes: Array) -> Dictionary:
	var next := stats.duplicate(true)
	for outcome in outcomes:
		for key in outcome.get("deltas", {}).keys():
			next[key] = _bounded(int(next.get(key, 0)) + int(outcome.deltas[key]))
	return next


func _update_factions(current_factions: Array, outcomes: Array, stats: Dictionary, rng: RandomNumberGenerator) -> Array:
	var next := []
	for faction_state in current_factions:
		var outcome := {}
		for candidate in outcomes:
			if candidate.agent_id == faction_state.id:
				outcome = candidate
				break
		var heat_delta := int(round(float(outcome.get("suspicion", 35)) / 12.0)) + int(round(float(stats.get("unrest", 0)) / 28.0)) - 2
		var trust_delta := int(round(float(int(stats.get("faith", 0)) - int(stats.get("paranoia", 0))) / 24.0)) + int(rng.randf() * 4.0) - 2
		var copy := faction_state.duplicate(true)
		copy.heat = _bounded(int(copy.heat) + heat_delta)
		copy.trust = _bounded(int(copy.trust) + trust_delta)
		next.append(copy)
	return next


func _create_citizen_letter(oracle: String, primary_topic: String, stats: Dictionary, rng: RandomNumberGenerator) -> Dictionary:
	var names := ["伊芙玻璃匠", "莫兰钟表师", "塞拉清道夫", "尼奥旧护士", "阿什门徒", "露卡逃兵", "塔维孤儿", "米娅书记员"]
	var roles := ["送水人", "见习修女", "地下印刷工", "粮仓守夜人", "弃誓士兵", "玻璃校舍学生", "市场账房"]
	var topic_lines := {
		"food": "今天我真的拿到了一小块面包,但给面包的人要我明天替他作证。",
		"truth": "他们让我站到灯下证明自己没有撒谎,可我害怕我的影子比别人长。",
		"equality": "广场上每个人都说自己终于平等,但士兵仍然站在高台上。",
		"death": "有人把死者的名字刻在墙上,然后要求我们继续活得更像旗帜。",
		"children": "学校关门了,老师说这是保护,我不知道保护为什么需要锁。",
		"wealth": "钱币上印着神的眼睛,穷人说那只眼睛从不看他们。",
		"faith": "教堂今天很满,但我听见有人在祈祷你不要再开口。"
	}
	var name := names[int(rng.randi() % names.size())]
	var role := roles[int(rng.randi() % roles.size())]
	var crisis := _detect_crisis(stats)

	return {
		"from": name,
		"role": role,
		"summary": "%s写来一封关于「%s」的信。" % [name, oracle],
		"body": "%s 如果这是你的意思,请下一次说得更像人一点。现在城里最重的词是「%s」。" % [topic_lines.get(primary_topic, topic_lines.faith), crisis.label]
	}


func _create_headline(oracle: String, primary_topic: String, ambiguity: int, stats: Dictionary) -> String:
	var topic := topic_labels.get(primary_topic, "神谕")
	var crisis := _detect_crisis(stats)
	var prefix := "七种译本同时流传" if ambiguity > 60 else "控制台重新发声"
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


func _bounded(value: int) -> int:
	return clampi(value, 0, 100)
