class_name SaveSystem
extends RefCounted

const SAVE_PATH := "user://god_is_offline_save.json"

func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


func save_game(game: Dictionary) -> bool:
	var payload := {
		"version": 1,
		"saved_at_unix": Time.get_unix_time_from_system(),
		"game": game
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("Unable to open save file for writing: %s" % SAVE_PATH)
		return false
	file.store_string(JSON.stringify(payload, "\t"))
	return true


func load_game() -> Dictionary:
	if not has_save():
		return {}
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		push_error("Unable to open save file for reading: %s" % SAVE_PATH)
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY or not parsed.has("game"):
		push_error("Save file is invalid or from an unsupported version.")
		return {}
	var game = parsed.game
	if not _is_valid_game(game):
		push_error("Save file is missing required game fields.")
		return {}
	return game


func delete_save() -> void:
	if has_save():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))


func _is_valid_game(game) -> bool:
	if typeof(game) != TYPE_DICTIONARY:
		return false
	for field in ["seed", "turn", "city_name", "prophecy", "stats", "factions", "memories", "last_outcome"]:
		if not game.has(field):
			return false
	return typeof(game.stats) == TYPE_DICTIONARY and typeof(game.factions) == TYPE_ARRAY and typeof(game.memories) == TYPE_ARRAY
