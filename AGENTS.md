# AGENTS.md

## Cursor Cloud specific instructions

This repository contains **God Is Offline**, an agent-native narrative strategy game. The primary direction is now a Godot 4 desktop vertical slice; the earlier static Web prototype remains as a concept/reference implementation.

### Current state

- **Primary game project**: `godot/` is a Godot 4.2+ desktop game project.
- **Reference prototype**: vanilla HTML/CSS/JavaScript ES modules in `index.html` and `src/`.
- **Dependencies**: none beyond Node.js and Python 3 available in the environment.
- **Godot core code**: `godot/scripts/oracle_engine.gd` contains the local agent/world-state runtime plus LLM-output validation/merge; `godot/scripts/main_controller.gd` builds the desktop control-room UI; `godot/scripts/llm_agent_client.gd` calls the local Agent Bridge; `godot/scripts/save_system.gd` handles local saves.
- **Godot data**: `godot/data/game_config.json` and `godot/data/factions.json`.
- **LLM bridge**: `tools/agent_bridge_server.mjs` runs a localhost bridge for OpenAI-compatible APIs, custom gateway/LLM Gate endpoints, Azure OpenAI, Ollama, or mock mode. This keeps API keys out of the Godot client.
- **Tests/validation**: `test/game.test.js` uses Node's built-in test runner for the JS reference runtime; `tools/validate_godot_project.mjs` validates Godot project structure and data.

### Development commands

- Run the Godot project:

  Open `godot/project.godot` with Godot 4.2+ and press Run. The main scene is `res://scenes/main.tscn`.

- Use the prebuilt Windows portable package:

  `dist/windows/GodIsOffline-Windows.zip`

  The zip includes `Start Agent Bridge.bat` for LLM Agent mode. It requires Node.js LTS and an API key for OpenAI-compatible mode.

- Run the Agent Bridge in development:

  ```bash
  OPENAI_API_KEY=... npm run start:agent
  ```

  Or with Ollama:

  ```bash
  LLM_PROVIDER=ollama LLM_MODEL=llama3.1 npm run start:agent
  ```

  Or with a custom OpenAI-compatible gateway:

  ```bash
  LLM_PROVIDER=gateway \
  LLM_BASE_URL=https://llm-api.example.com/OnPrem \
  LLM_MODEL=GPT-oss-20B \
  LLM_API_KEY=dummy \
  LLM_GATEWAY_SUBSCRIPTION_KEY=<your-subscription-key> \
  LLM_GATEWAY_USER=<your-user> \
  npm run start:agent
  ```

  Gateway path overrides are supported with `LLM_CHAT_COMPLETIONS_PATH` or `LLM_CHAT_COMPLETIONS_URL`. Deployment-style gateways are supported with `LLM_USE_DEPLOYMENT_PATH=1` or `LLM_DEPLOYMENT_PATH_TEMPLATE`. Diagnose connectivity with:

  ```bash
  npm run test:llm-gateway
  ```

  Or with Azure OpenAI:

  ```bash
  LLM_PROVIDER=azure \
  AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com \
  AZURE_OPENAI_DEPLOYMENT=gpt-5.5 \
  AZURE_OPENAI_API_VERSION=2025-01-01-preview \
  AZURE_OPENAI_API_KEY=<your-azure-key> \
  npm run start:agent
  ```

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
- The Godot game supports both offline deterministic persona agents and LLM Agent Bridge mode. Offline mode must remain available as a fallback when bridge/API calls fail.
- LLM output is not trusted. Keep `godot/scripts/oracle_engine.gd` validation for stat keys, delta ranges, faction IDs, memory length, and text length before mutating world state.
- Never commit real API keys, subscription keys, gateway headers, or Azure keys. Use env vars / Windows prompt placeholders only.
- Keep player-facing copy in Simplified Chinese unless the product direction changes.
