# AGENTS.md

## Cursor Cloud specific instructions

This repository contains **God Is Offline**, an agent-native narrative strategy game. The primary direction is now a Godot 4 desktop vertical slice; the earlier static Web prototype remains as a concept/reference implementation.

### Current state

- **Primary game project**: `godot/` is a Godot 4.2+ desktop game project.
- **Reference prototype**: vanilla HTML/CSS/JavaScript ES modules in `index.html` and `src/`.
- **Dependencies**: none beyond Node.js and Python 3 available in the environment.
- **Godot core code**: `godot/scripts/oracle_engine.gd` contains the local agent/world-state runtime; `godot/scripts/main_controller.gd` builds the desktop control-room UI; `godot/scripts/save_system.gd` handles local saves.
- **Godot data**: `godot/data/game_config.json` and `godot/data/factions.json`.
- **Tests/validation**: `test/game.test.js` uses Node's built-in test runner for the JS reference runtime; `tools/validate_godot_project.mjs` validates Godot project structure and data.

### Development commands

- Run the Godot project:

  Open `godot/project.godot` with Godot 4.2+ and press Run. The main scene is `res://scenes/main.tscn`.

- Use the prebuilt Windows portable package:

  `dist/windows/GodIsOffline-Windows.zip`

- Rebuild the Windows portable package from Linux:

  ```bash
  ./tools/export_windows_release.sh
  ```

  This downloads Godot 4.2.2 and Windows export templates into `.cache/`, performs a headless project parse, exports the Windows executable, and creates `dist/windows/GodIsOffline-Windows.zip`.

- Run the local static Web reference:

  ```bash
  npm start
  ```

  Then open `http://localhost:5173`.

- Run tests:

  ```bash
  npm test
  ```

  This runs the JS reference tests and validates the Godot project structure.

### Development caveats

- The repository includes a generated Windows portable zip. If game code or Godot data changes, regenerate it with `./tools/export_windows_release.sh` before claiming the Windows package is current.
- The first Godot vertical slice intentionally uses deterministic local persona agents instead of external LLM calls, so it runs without API keys.
- If replacing local agents with real model-backed agents, keep `godot/scripts/oracle_engine.gd`'s state transition contract testable and preserve deterministic tests for core world-state invariants.
- Keep player-facing copy in Simplified Chinese unless the product direction changes.
