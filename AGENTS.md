# AGENTS.md

## Cursor Cloud specific instructions

This repository now contains a small static Web prototype for **God Is Offline**, an agent-native game about issuing one oracle per turn and watching faction agents reinterpret it.

### Current state

- **Runtime**: vanilla HTML/CSS/JavaScript ES modules.
- **Dependencies**: none beyond Node.js and Python 3 available in the environment.
- **Core code**: `src/game.js` contains the local agent/world-state runtime; `src/app.js` wires it to the browser UI.
- **Tests**: `test/game.test.js` uses Node's built-in test runner.

### Development commands

- Run the local static server:

  ```bash
  npm start
  ```

  Then open `http://localhost:5173`.

- Run tests:

  ```bash
  npm test
  ```

### Development caveats

- The first prototype intentionally uses deterministic local persona agents instead of external LLM calls, so it runs without API keys.
- If replacing local agents with real model-backed agents, keep `src/game.js`'s state transition contract testable and preserve deterministic tests for core world-state invariants.
- Keep player-facing copy in Simplified Chinese unless the product direction changes.
