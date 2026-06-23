extends Control

const OracleEngineScript := preload("res://scripts/oracle_engine.gd")
const SaveSystemScript := preload("res://scripts/save_system.gd")
const LLMAgentClientScript := preload("res://scripts/llm_agent_client.gd")

var engine
var save_system
var llm_client
var game := {}
var screen_root: Control
var oracle_input: TextEdit
var status_label: Label
var llm_enabled := false
var llm_mode := "bridge"
var llm_endpoint := "http://127.0.0.1:8787/resolve"
var amd_base_url := "https://llm-api.amd.com/OpenAI"
var amd_model := "gpt-5.5"
var amd_subscription_key := ""
var amd_user := ""
var amd_placeholder_key := "placeholder-key"
var llm_request_in_flight := false

var palette := {
	"bg": Color("#09080F"),
	"panel": Color(0.095, 0.083, 0.15, 0.92),
	"panel_alt": Color(0.13, 0.105, 0.20, 0.94),
	"line": Color(1, 1, 1, 0.12),
	"text": Color("#F4EFFF"),
	"muted": Color("#AAA0C4"),
	"gold": Color("#FFCD6B"),
	"cyan": Color("#7FFFD4"),
	"danger": Color("#FF6B8A")
}

func _ready() -> void:
	engine = OracleEngineScript.new()
	save_system = SaveSystemScript.new()
	llm_client = LLMAgentClientScript.new()
	game = engine.new_game("godot-vertical-slice")
	_build_screen_root()
	_show_main_menu()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("quick_save") and not game.is_empty():
		_save_current_game()


func _build_screen_root() -> void:
	var background := ColorRect.new()
	background.name = "CinematicBackground"
	background.color = palette.bg
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	screen_root = Control.new()
	screen_root.name = "ScreenRoot"
	screen_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(screen_root)


func _clear_screen() -> void:
	for child in screen_root.get_children():
		child.queue_free()


func _show_main_menu() -> void:
	_clear_screen()

	var frame := _margin_frame(72)
	screen_root.add_child(frame)

	var layout := HBoxContainer.new()
	layout.add_theme_constant_override("separation", 48)
	frame.add_child(layout)

	var left := VBoxContainer.new()
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left.size_flags_vertical = Control.SIZE_EXPAND_FILL
	left.add_theme_constant_override("separation", 22)
	layout.add_child(left)

	left.add_child(_eyebrow("AGENT-NATIVE NARRATIVE STRATEGY"))
	left.add_child(_label("神已离线", 92, palette.text, HORIZONTAL_ALIGNMENT_LEFT))
	left.add_child(_label("你不是英雄。你是一个旧神接口,每回合只能说一句话。城市里的 agent 会误解、利用、反抗、研究你。", 24, palette.muted, HORIZONTAL_ALIGNMENT_LEFT, true))
	left.add_spacer(false)
	left.add_child(_label("Vertical Slice / 旧神控制室", 18, palette.gold))

	var right := _panel()
	right.custom_minimum_size = Vector2(440, 0)
	layout.add_child(right)

	var menu := VBoxContainer.new()
	menu.add_theme_constant_override("separation", 16)
	right.add_child(menu)
	menu.add_child(_label("控制台状态", 28, palette.text))
	menu.add_child(_label("第一章: 圣玻璃城正在等待一句会被曲解的神谕。", 18, palette.muted, HORIZONTAL_ALIGNMENT_LEFT, true))
	menu.add_child(_menu_button("开始新游戏", func(): _start_new_game()))
	var continue_button := _menu_button("继续游戏", func(): _continue_game())
	continue_button.disabled = not save_system.has_save()
	menu.add_child(continue_button)
	menu.add_child(_menu_button("设置 / 发行规格", func(): _show_settings()))
	menu.add_child(_menu_button("退出", func(): get_tree().quit()))


func _start_new_game() -> void:
	game = engine.new_game("godot-vertical-slice-%d" % Time.get_unix_time_from_system())
	_show_control_room()


func _continue_game() -> void:
	var loaded: Dictionary = save_system.load_game()
	if loaded.is_empty():
		_show_status("没有找到可读取的存档。", true)
		return
	game = loaded
	_show_control_room()


func _show_settings() -> void:
	_clear_screen()

	var frame := _margin_frame(56)
	screen_root.add_child(frame)

	var panel := _panel()
	frame.add_child(panel)

	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 18)
	panel.add_child(layout)
	layout.add_child(_eyebrow("PRODUCTION INTENT"))
	layout.add_child(_label("正规游戏化目标", 44, palette.text))
	layout.add_child(_label("这一版工程按 Steam 独立游戏 vertical slice 组织: Godot 4 桌面项目、主菜单、存档、设置入口、数据驱动 agent runtime、可扩展的控制室 UI。", 20, palette.muted, HORIZONTAL_ALIGNMENT_LEFT, true))
	layout.add_child(_label("后续资产管线", 28, palette.gold))
	layout.add_child(_bullet_list([
		"美术: 旧神控制室、玻璃教堂 UI、阵营徽记、城市投影。",
		"音频: 低频控制室 drone、雨声、钟声、新闻打字声、暴动远景。",
		"系统: 关键 NPC 长期记忆、派系密谋、终局判定、章节化事件。",
		"发行: Windows/macOS/Linux 导出预设、Steam capsule、trailer、手柄适配。"
	]))
	layout.add_child(_label("LLM Agent Bridge", 28, palette.gold))
	layout.add_child(_label("开启后,游戏会调用本机 Agent Bridge 或直接请求 AMD LLM Gateway,生成更活的阵营行动、阴谋和 NPC 记忆; 本地规则引擎仍负责校验和结算。", 18, palette.muted, HORIZONTAL_ALIGNMENT_LEFT, true))
	var llm_toggle := CheckButton.new()
	llm_toggle.text = "启用 LLM Agent 模式"
	llm_toggle.button_pressed = llm_enabled
	llm_toggle.add_theme_font_size_override("font_size", 20)
	llm_toggle.add_theme_color_override("font_color", palette.text)
	layout.add_child(llm_toggle)
	var mode_select := OptionButton.new()
	mode_select.add_item("本地 Agent Bridge", 0)
	mode_select.add_item("直连 AMD LLM Gateway", 1)
	mode_select.selected = 1 if llm_mode == "direct_amd" else 0
	mode_select.add_theme_font_size_override("font_size", 18)
	layout.add_child(mode_select)
	var endpoint_input := LineEdit.new()
	endpoint_input.text = llm_endpoint
	endpoint_input.placeholder_text = "http://127.0.0.1:8787/resolve"
	endpoint_input.add_theme_font_size_override("font_size", 18)
	endpoint_input.add_theme_color_override("font_color", palette.text)
	endpoint_input.add_theme_stylebox_override("normal", _style(Color(1, 1, 1, 0.065), 14))
	layout.add_child(endpoint_input)
	layout.add_child(_label("AMD Gateway 登录入口", 24, palette.gold))
	layout.add_child(_label("密钥只保存在本次游戏运行内存中,不会写入存档或仓库。AMD OpenAI/GPT endpoint 默认是 https://llm-api.amd.com/OpenAI。", 16, palette.muted, HORIZONTAL_ALIGNMENT_LEFT, true))
	var amd_base_input := _line_edit(amd_base_url, "https://llm-api.amd.com/OpenAI")
	layout.add_child(amd_base_input)
	var amd_model_input := _line_edit(amd_model, "gpt-5.5")
	layout.add_child(amd_model_input)
	var amd_key_input := _line_edit(amd_subscription_key, "AMD_LLM_GATEWAY_KEY / Ocp-Apim-Subscription-Key")
	amd_key_input.secret = true
	layout.add_child(amd_key_input)
	var amd_user_input := _line_edit(amd_user, "user header, 例如你的 AMD 用户名")
	layout.add_child(amd_user_input)
	layout.add_child(_small_button("保存 LLM 设置", func():
		llm_enabled = llm_toggle.button_pressed
		llm_mode = "direct_amd" if mode_select.selected == 1 else "bridge"
		llm_endpoint = endpoint_input.text.strip_edges()
		amd_base_url = amd_base_input.text.strip_edges()
		amd_model = amd_model_input.text.strip_edges()
		amd_subscription_key = amd_key_input.text.strip_edges()
		amd_user = amd_user_input.text.strip_edges()
		_show_main_menu()
	))
	layout.add_child(_menu_button("返回主菜单", func(): _show_main_menu()))


func _show_control_room() -> void:
	_clear_screen()

	var outer := _margin_frame(28)
	screen_root.add_child(outer)

	var vertical := VBoxContainer.new()
	vertical.add_theme_constant_override("separation", 18)
	outer.add_child(vertical)

	vertical.add_child(_build_top_bar())
	vertical.add_child(_build_command_deck())

	var columns := HBoxContainer.new()
	columns.size_flags_vertical = Control.SIZE_EXPAND_FILL
	columns.add_theme_constant_override("separation", 18)
	vertical.add_child(columns)

	var left := VBoxContainer.new()
	left.custom_minimum_size = Vector2(410, 0)
	left.add_theme_constant_override("separation", 18)
	columns.add_child(left)
	left.add_child(_build_city_panel())
	left.add_child(_build_memory_panel())

	var center := VBoxContainer.new()
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	center.add_theme_constant_override("separation", 18)
	columns.add_child(center)
	center.add_child(_build_report_panel())

	var right := VBoxContainer.new()
	right.custom_minimum_size = Vector2(420, 0)
	right.add_theme_constant_override("separation", 18)
	columns.add_child(right)
	right.add_child(_build_faction_panel())
	right.add_child(_build_prophecy_panel())

	_play_screen_reveal(vertical)


func _build_top_bar() -> Control:
	var panel := _panel(14)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 16)
	panel.add_child(row)

	var title := VBoxContainer.new()
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(title)
	title.add_child(_eyebrow("OLD GOD CONSOLE / %s" % game.city_name))
	title.add_child(_label("回合 %d" % int(game.turn), 32, palette.text))

	var mode_name := "Direct AMD" if llm_mode == "direct_amd" else "Bridge"
	var mode_text := "LLM Agent: %s" % mode_name if llm_enabled else "Local Rules: ON"
	status_label = _label("%s / 控制台等待神谕。" % mode_text, 18, palette.muted)
	row.add_child(status_label)
	var llm_button := _small_button("LLM 开关", func():
		llm_enabled = not llm_enabled
		_show_control_room()
	)
	llm_button.disabled = llm_request_in_flight
	row.add_child(llm_button)
	var save_button := _small_button("保存", func(): _save_current_game())
	save_button.disabled = llm_request_in_flight
	row.add_child(save_button)
	var menu_button := _small_button("主菜单", func(): _show_main_menu())
	menu_button.disabled = llm_request_in_flight
	row.add_child(menu_button)
	return panel


func _build_command_deck() -> Control:
	var panel := _panel()
	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 12)
	panel.add_child(layout)
	layout.add_child(_eyebrow("ISSUE ORACLE"))
	var mode_hint := "当前: %s 会生成活的阴谋,本地规则引擎负责校验。" % ("直连 AMD Gateway" if llm_mode == "direct_amd" else "LLM Agent Bridge") if llm_enabled else "当前: 离线规则 agent。可在设置里开启 LLM Agent。"
	layout.add_child(_label("每回合只能说一句话。越模糊,越容易被世界利用。%s" % mode_hint, 20, palette.muted, HORIZONTAL_ALIGNMENT_LEFT, true))

	oracle_input = TextEdit.new()
	oracle_input.custom_minimum_size = Vector2(0, 96)
	oracle_input.placeholder_text = "例如: 从今夜开始,说谎者的影子会变长。"
	oracle_input.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
	oracle_input.add_theme_font_size_override("font_size", 22)
	oracle_input.add_theme_color_override("font_color", palette.text)
	oracle_input.add_theme_color_override("font_placeholder_color", palette.muted)
	oracle_input.add_theme_stylebox_override("normal", _style(Color(1, 1, 1, 0.065), 18))
	layout.add_child(oracle_input)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	layout.add_child(row)
	row.add_child(_primary_button("发布神谕", func(): _submit_oracle()))
	for sample in engine.get_samples():
		var sample_text := String(sample)
		row.add_child(_chip_button(sample_text, Callable(self, "_use_sample").bind(sample_text)))

	return panel


func _submit_oracle() -> void:
	if llm_request_in_flight:
		return
	var text := oracle_input.text.strip_edges()
	if text.is_empty():
		_show_status("神谕不能为空。", true)
		return
	oracle_input.editable = false
	if llm_enabled:
		llm_request_in_flight = true
		_show_status("正在等待 %s 回应..." % ("AMD LLM Gateway" if llm_mode == "direct_amd" else "LLM Agent Bridge"), false)
		var agent_result: Dictionary
		if llm_mode == "direct_amd":
			agent_result = await llm_client.resolve_oracle_direct_openai(get_tree().root, {
				"base_url": amd_base_url,
				"model": amd_model,
				"subscription_key": amd_subscription_key,
				"user": amd_user,
				"placeholder_key": amd_placeholder_key
			}, text, game)
		else:
			agent_result = await llm_client.resolve_oracle(get_tree().root, llm_endpoint, text, game)
		llm_request_in_flight = false
		if bool(agent_result.get("ok", false)):
			game = engine.resolve_oracle_with_agent(game, text, agent_result)
		else:
			game = engine.resolve_oracle(game, text)
			var fallback_memories: Array = game.memories.duplicate(true)
			fallback_memories.push_front("LLM Agent Bridge 失败,本回合已回退本地规则: %s" % agent_result.get("message", "unknown error"))
			game.memories = fallback_memories.slice(0, 12)
	else:
		game = engine.resolve_oracle(game, text)
	if is_instance_valid(oracle_input):
		oracle_input.text = ""
	_save_current_game(false)
	_show_control_room()


func _use_sample(text: String) -> void:
	oracle_input.text = text
	oracle_input.grab_focus()


func _build_city_panel() -> Control:
	var panel := _panel()
	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 12)
	panel.add_child(layout)
	layout.add_child(_eyebrow("WORLD STATE"))
	layout.add_child(_label("城市指标", 28, palette.text))

	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	layout.add_child(grid)

	for stat_id in game.stats.keys():
		grid.add_child(_stat_card(stat_id, int(game.stats[stat_id])))

	return panel


func _build_memory_panel() -> Control:
	var panel := _panel()
	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 10)
	panel.add_child(layout)
	layout.add_child(_eyebrow("CITY MEMORY"))
	layout.add_child(_label("城市记忆", 26, palette.text))
	for memory in game.memories:
		layout.add_child(_label("• %s" % memory, 15, palette.muted, HORIZONTAL_ALIGNMENT_LEFT, true))
	return panel


func _build_report_panel() -> Control:
	var panel := _panel()
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	panel.add_child(scroll)

	var layout := VBoxContainer.new()
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 14)
	scroll.add_child(layout)
	layout.add_child(_eyebrow("AGENT REPORTS"))
	layout.add_child(_label("解释权战争", 34, palette.text))

	var outcome: Dictionary = game.get("last_outcome", {})
	if outcome.is_empty():
		layout.add_child(_report_card("等待第一句神谕", "旧神控制室已经点亮。城市还不知道你会保护谁,惩罚谁,以及谁会学会操控你。", palette.gold))
		return panel

	layout.add_child(_report_card("棱镜公报", outcome.headline, palette.gold))
	if bool(outcome.get("llm_enabled", false)):
		layout.add_child(_report_card("LLM Agent Director / %s" % outcome.get("llm_model", "unknown"), outcome.get("director_note", "LLM 已参与本轮世界演化。"), palette.cyan))
	layout.add_child(_report_card("情报官 UI Agent", outcome.ui.summary, palette.cyan))
	for report in outcome.faction_outcomes:
		layout.add_child(_report_card(report.agent_name, "%s\n\n%s\n\n%s" % [report.voice, report.interpretation, _format_deltas(report.deltas)], Color.html(report.color)))
	layout.add_child(_report_card(outcome.rumor.agent_name, "%s\n\n%s" % [outcome.rumor.interpretation, _format_deltas(outcome.rumor.deltas)], palette.danger))
	layout.add_child(_report_card("关键人物来信 / %s" % outcome.citizen.role, "%s: %s" % [outcome.citizen.from, outcome.citizen.body], palette.cyan))
	layout.add_child(_report_card("终局预言压力 %d%%" % int(outcome.terminal_pressure.score), "\n".join(outcome.terminal_pressure.reasons), palette.gold))
	return panel


func _build_faction_panel() -> Control:
	var panel := _panel()
	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 12)
	panel.add_child(layout)
	layout.add_child(_eyebrow("FACTION AGENTS"))
	layout.add_child(_label("六大阵营", 28, palette.text))

	for faction in game.factions:
		layout.add_child(_faction_row(faction))

	return panel


func _build_prophecy_panel() -> Control:
	var panel := _panel()
	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 12)
	panel.add_child(layout)
	layout.add_child(_eyebrow("TERMINAL PROPHECY"))
	layout.add_child(_label(game.prophecy, 24, palette.gold, HORIZONTAL_ALIGNMENT_LEFT, true))

	var input := LineEdit.new()
	input.placeholder_text = "改写终局预言"
	input.add_theme_font_size_override("font_size", 18)
	input.add_theme_color_override("font_color", palette.text)
	input.add_theme_stylebox_override("normal", _style(Color(1, 1, 1, 0.065), 14))
	layout.add_child(input)
	layout.add_child(_small_button("写入终局条件", func():
		game = engine.set_prophecy(game, input.text)
		_save_current_game(false)
		_show_control_room()
	))
	return panel


func _stat_card(stat_id: String, value: int) -> Control:
	var card := _panel(12, Color(1, 1, 1, 0.045))
	card.custom_minimum_size = Vector2(184, 86)
	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 8)
	card.add_child(layout)
	var row := HBoxContainer.new()
	layout.add_child(row)
	row.add_child(_label(engine.get_stat_label(stat_id), 16, palette.muted))
	row.add_spacer(false)
	row.add_child(_label(str(value), 24, _value_color(value)))
	var bar := ProgressBar.new()
	bar.max_value = 100
	bar.value = value
	bar.show_percentage = false
	bar.add_theme_stylebox_override("background", _style(Color(1, 1, 1, 0.07), 99))
	bar.add_theme_stylebox_override("fill", _style(_value_color(value), 99))
	layout.add_child(bar)
	return card


func _faction_row(faction: Dictionary) -> Control:
	var card := _panel(12, Color(1, 1, 1, 0.045))
	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 8)
	card.add_child(layout)
	layout.add_child(_label(faction.name, 20, Color(faction.color)))
	layout.add_child(_label("信任 %d  /  热度 %d" % [int(faction.trust), int(faction.heat)], 15, palette.muted))
	return card


func _report_card(title: String, body: String, accent: Color) -> Control:
	var card := _panel(16, Color(1, 1, 1, 0.052))
	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 8)
	card.add_child(layout)
	layout.add_child(_label(title, 22, accent, HORIZONTAL_ALIGNMENT_LEFT, true))
	layout.add_child(_label(body, 17, palette.muted, HORIZONTAL_ALIGNMENT_LEFT, true))
	return card


func _bullet_list(items: Array) -> Control:
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 8)
	for item in items:
		box.add_child(_label("• %s" % item, 18, palette.muted, HORIZONTAL_ALIGNMENT_LEFT, true))
	return box


func _save_current_game(show_message := true) -> void:
	if save_system.save_game(game) and show_message:
		_show_status("已保存到本机用户目录。", false)


func _show_status(message: String, is_error := false) -> void:
	if status_label == null:
		return
	status_label.text = message
	status_label.add_theme_color_override("font_color", palette.danger if is_error else palette.cyan)


func _format_deltas(deltas: Dictionary) -> String:
	var parts := []
	for key in deltas.keys():
		var value := int(deltas[key])
		var sign := "+" if value > 0 else ""
		parts.append("%s %s%d" % [engine.get_stat_label(key), sign, value])
	return " / ".join(parts)


func _value_color(value: int) -> Color:
	if value >= 70:
		return palette.danger
	if value <= 30:
		return Color("#8CFF9D")
	return palette.gold


func _play_screen_reveal(target: Control) -> void:
	target.modulate = Color(1, 1, 1, 0)
	target.position.y += 12
	var tween := create_tween()
	tween.tween_property(target, "modulate", Color.WHITE, 0.35).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(target, "position:y", target.position.y - 12, 0.35).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)


func _margin_frame(margin: int) -> MarginContainer:
	var frame := MarginContainer.new()
	frame.set_anchors_preset(Control.PRESET_FULL_RECT)
	frame.add_theme_constant_override("margin_left", margin)
	frame.add_theme_constant_override("margin_right", margin)
	frame.add_theme_constant_override("margin_top", margin)
	frame.add_theme_constant_override("margin_bottom", margin)
	return frame


func _panel(radius := 24, color = null) -> PanelContainer:
	var panel := PanelContainer.new()
	var actual_color: Color = palette.panel if color == null else color
	panel.add_theme_stylebox_override("panel", _style(actual_color, radius))
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return panel


func _style(color: Color, radius: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = palette.line
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	style.content_margin_left = 18
	style.content_margin_right = 18
	style.content_margin_top = 18
	style.content_margin_bottom = 18
	return style


func _label(text: String, size: int, color = null, align := HORIZONTAL_ALIGNMENT_LEFT, wrap := false) -> Label:
	var label := Label.new()
	var actual_color: Color = palette.text if color == null else color
	label.text = text
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART if wrap else TextServer.AUTOWRAP_OFF
	label.horizontal_alignment = align
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", actual_color)
	return label


func _eyebrow(text: String) -> Label:
	var label := _label(text, 13, palette.cyan)
	label.uppercase = true
	return label


func _line_edit(text: String, placeholder: String) -> LineEdit:
	var input := LineEdit.new()
	input.text = text
	input.placeholder_text = placeholder
	input.add_theme_font_size_override("font_size", 18)
	input.add_theme_color_override("font_color", palette.text)
	input.add_theme_color_override("font_placeholder_color", palette.muted)
	input.add_theme_stylebox_override("normal", _style(Color(1, 1, 1, 0.065), 14))
	return input


func _menu_button(text: String, callback: Callable) -> Button:
	var button := _button_base(text)
	button.custom_minimum_size = Vector2(0, 58)
	button.add_theme_font_size_override("font_size", 21)
	button.pressed.connect(callback)
	return button


func _primary_button(text: String, callback: Callable) -> Button:
	var button := _button_base(text, palette.gold, Color("#120D18"))
	button.custom_minimum_size = Vector2(180, 48)
	button.pressed.connect(callback)
	return button


func _small_button(text: String, callback: Callable) -> Button:
	var button := _button_base(text, Color(1, 1, 1, 0.08), palette.text)
	button.custom_minimum_size = Vector2(110, 44)
	button.pressed.connect(callback)
	return button


func _chip_button(text: String, callback: Callable) -> Button:
	var button := _button_base(text, Color(1, 1, 1, 0.075), palette.text)
	button.custom_minimum_size = Vector2(0, 42)
	button.add_theme_font_size_override("font_size", 14)
	button.pressed.connect(callback)
	return button


func _button_base(text: String, bg = null, fg = null) -> Button:
	var button := Button.new()
	var actual_bg: Color = palette.panel_alt if bg == null else bg
	var actual_fg: Color = palette.text if fg == null else fg
	button.text = text
	button.focus_mode = Control.FOCUS_ALL
	button.add_theme_color_override("font_color", actual_fg)
	button.add_theme_color_override("font_pressed_color", actual_fg)
	button.add_theme_color_override("font_hover_color", actual_fg)
	button.add_theme_stylebox_override("normal", _style(actual_bg, 999))
	button.add_theme_stylebox_override("hover", _style(actual_bg.lightened(0.08), 999))
	button.add_theme_stylebox_override("pressed", _style(actual_bg.darkened(0.08), 999))
	button.add_theme_stylebox_override("disabled", _style(Color(1, 1, 1, 0.035), 999))
	return button
