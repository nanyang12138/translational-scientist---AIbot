#!/usr/bin/env bash
set -euo pipefail

GODOT_VERSION="${GODOT_VERSION:-4.2.2-stable}"
GODOT_TEMPLATE_VERSION="${GODOT_TEMPLATE_VERSION:-4.2.2.stable}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="$ROOT_DIR/.cache/godot"
TEMPLATE_CACHE_DIR="$ROOT_DIR/.cache/godot-templates"
GODOT_ZIP="$CACHE_DIR/Godot_v${GODOT_VERSION}_linux.x86_64.zip"
TEMPLATES_TPZ="$CACHE_DIR/Godot_v${GODOT_VERSION}_export_templates.tpz"
GODOT_BIN="$CACHE_DIR/Godot_v${GODOT_VERSION}_linux.x86_64"
TEMPLATE_DIR="$HOME/.local/share/godot/export_templates/$GODOT_TEMPLATE_VERSION"
WINDOWS_EXE="$ROOT_DIR/build/windows/God Is Offline.exe"
WINDOWS_ZIP="$ROOT_DIR/dist/windows/GodIsOffline-Windows.zip"

mkdir -p "$CACHE_DIR" "$TEMPLATE_CACHE_DIR" "$TEMPLATE_DIR" "$ROOT_DIR/build/windows" "$ROOT_DIR/dist/windows"

if [[ ! -x "$GODOT_BIN" ]]; then
  if [[ ! -f "$GODOT_ZIP" ]]; then
    curl -L --fail --retry 3 \
      -o "$GODOT_ZIP" \
      "https://github.com/godotengine/godot/releases/download/${GODOT_VERSION}/Godot_v${GODOT_VERSION}_linux.x86_64.zip"
  fi
  unzip -o -q "$GODOT_ZIP" -d "$CACHE_DIR"
  chmod +x "$GODOT_BIN"
fi

if [[ ! -f "$TEMPLATE_DIR/windows_release_x86_64.exe" ]]; then
  if [[ ! -f "$TEMPLATES_TPZ" ]]; then
    curl -L --fail --retry 3 \
      -o "$TEMPLATES_TPZ" \
      "https://github.com/godotengine/godot/releases/download/${GODOT_VERSION}/Godot_v${GODOT_VERSION}_export_templates.tpz"
  fi
  unzip -o -q "$TEMPLATES_TPZ" -d "$TEMPLATE_CACHE_DIR"
  cp "$TEMPLATE_CACHE_DIR"/templates/windows_* "$TEMPLATE_DIR/"
fi

"$GODOT_BIN" --headless --path "$ROOT_DIR/godot" --quit
"$GODOT_BIN" --headless --path "$ROOT_DIR/godot" --export-release "Windows Desktop"

python3 - <<PY
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path("$ROOT_DIR")
exe = Path("$WINDOWS_EXE")
out = Path("$WINDOWS_ZIP")
out.parent.mkdir(parents=True, exist_ok=True)

with ZipFile(out, "w", ZIP_DEFLATED) as z:
    z.write(exe, "God Is Offline.exe")
    z.write(root / "tools" / "agent_bridge_server.mjs", "tools/agent_bridge_server.mjs")
    z.write(root / "godot" / "data" / "game_config.json", "godot/data/game_config.json")
    z.write(root / "godot" / "data" / "factions.json", "godot/data/factions.json")
    z.writestr(
        "Start Agent Bridge.bat",
        "@echo off\r\n"
        "title God Is Offline - Agent Bridge\r\n"
        "cd /d \"%~dp0\"\r\n"
        "where node >nul 2>nul\r\n"
        "if errorlevel 1 (\r\n"
        "  echo Node.js is required for LLM Agent Bridge.\r\n"
        "  echo Install Node.js LTS from https://nodejs.org/\r\n"
        "  pause\r\n"
        "  exit /b 1\r\n"
        ")\r\n"
        "if \"%LLM_PROVIDER%\"==\"\" set LLM_PROVIDER=openai\r\n"
        "if /I \"%LLM_PROVIDER%\"==\"openai\" if \"%OPENAI_API_KEY%\"==\"\" (\r\n"
        "  echo Paste your OpenAI-compatible API key. Input is visible in this prototype helper.\r\n"
        "  set /p OPENAI_API_KEY=OPENAI_API_KEY: \r\n"
        ")\r\n"
        "if \"%LLM_MODEL%\"==\"\" set LLM_MODEL=gpt-4o-mini\r\n"
        "echo Starting Agent Bridge at http://127.0.0.1:8787/resolve\r\n"
        "node tools\\agent_bridge_server.mjs\r\n"
        "pause\r\n",
    )
    z.writestr(
        "README.txt",
        "God Is Offline / 神已离线\\n\\n"
        "Windows portable build exported with Godot 4.2.2.\\n"
        "Offline mode: unzip this archive, then double-click \"God Is Offline.exe\" to run.\\n\\n"
        "LLM Agent mode:\\n"
        "1. Install Node.js LTS if needed.\\n"
        "2. Double-click \"Start Agent Bridge.bat\" and paste your API key.\\n"
        "3. Launch the game, open Settings, enable LLM Agent mode, keep endpoint http://127.0.0.1:8787/resolve.\\n\\n"
        "If Windows SmartScreen appears, choose More info -> Run anyway.\\n",
    )

print(out)
print(f"{out.stat().st_size / (1024 * 1024):.1f} MB")
PY
