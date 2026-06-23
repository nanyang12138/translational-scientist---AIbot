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

- The current Cloud environment does not have the Godot CLI installed. Do not claim Godot editor launch or binary export has been verified here unless you run it in an environment with Godot 4.2+.
- The first Godot vertical slice intentionally uses deterministic local persona agents instead of external LLM calls, so it runs without API keys.
- If replacing local agents with real model-backed agents, keep `godot/scripts/oracle_engine.gd`'s state transition contract testable and preserve deterministic tests for core world-state invariants.
- Keep player-facing copy in Simplified Chinese unless the product direction changes.
