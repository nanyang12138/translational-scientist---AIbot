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
        "if \"%LLM_PROVIDER%\"==\"\" (\r\n"
        "  echo Choose provider: openai, gateway, azure, ollama, mock\r\n"
        "  set /p LLM_PROVIDER=LLM_PROVIDER [gateway]: \r\n"
        "  if \"%LLM_PROVIDER%\"==\"\" set LLM_PROVIDER=gateway\r\n"
        ")\r\n"
        "if /I \"%LLM_PROVIDER%\"==\"gateway\" (\r\n"
        "  if \"%LLM_BASE_URL%\"==\"\" set /p LLM_BASE_URL=Gateway base URL [https://llm-api.example.com/OnPrem]: \r\n"
        "  if \"%LLM_MODEL%\"==\"\" set /p LLM_MODEL=Model [GPT-oss-20B]: \r\n"
        "  if \"%LLM_MODEL%\"==\"\" set LLM_MODEL=GPT-oss-20B\r\n"
        "  if \"%LLM_API_KEY%\"==\"\" set /p LLM_API_KEY=API key or dummy value [dummy]: \r\n"
        "  if \"%LLM_API_KEY%\"==\"\" set LLM_API_KEY=dummy\r\n"
        "  if \"%LLM_GATEWAY_SUBSCRIPTION_KEY%\"==\"\" set /p LLM_GATEWAY_SUBSCRIPTION_KEY=Ocp-Apim-Subscription-Key: \r\n"
        "  if \"%LLM_GATEWAY_USER%\"==\"\" set /p LLM_GATEWAY_USER=user header value: \r\n"
        "  if \"%LLM_CHAT_COMPLETIONS_PATH%\"==\"\" if \"%LLM_CHAT_COMPLETIONS_URL%\"==\"\" set /p LLM_CHAT_COMPLETIONS_PATH=Optional chat path override [chat/completions]: \r\n"
        ")\r\n"
        "if /I \"%LLM_PROVIDER%\"==\"azure\" (\r\n"
        "  if \"%AZURE_OPENAI_ENDPOINT%\"==\"\" set /p AZURE_OPENAI_ENDPOINT=Azure endpoint, e.g. https://name.openai.azure.com: \r\n"
        "  if \"%AZURE_OPENAI_DEPLOYMENT%\"==\"\" set /p AZURE_OPENAI_DEPLOYMENT=Azure deployment/model [gpt-5.5]: \r\n"
        "  if \"%AZURE_OPENAI_DEPLOYMENT%\"==\"\" set AZURE_OPENAI_DEPLOYMENT=gpt-5.5\r\n"
        "  if \"%AZURE_OPENAI_API_VERSION%\"==\"\" set /p AZURE_OPENAI_API_VERSION=Azure API version [2025-01-01-preview]: \r\n"
        "  if \"%AZURE_OPENAI_API_VERSION%\"==\"\" set AZURE_OPENAI_API_VERSION=2025-01-01-preview\r\n"
        "  if \"%AZURE_OPENAI_API_KEY%\"==\"\" set /p AZURE_OPENAI_API_KEY=Azure API key: \r\n"
        ")\r\n"
        "if /I \"%LLM_PROVIDER%\"==\"openai\" (\r\n"
        "  if \"%OPENAI_API_KEY%\"==\"\" set /p OPENAI_API_KEY=OPENAI_API_KEY: \r\n"
        "  if \"%LLM_MODEL%\"==\"\" set LLM_MODEL=gpt-4o-mini\r\n"
        ")\r\n"
        "if /I \"%LLM_PROVIDER%\"==\"ollama\" if \"%LLM_MODEL%\"==\"\" set LLM_MODEL=llama3.1\r\n"
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
        "2. Double-click \"Start Agent Bridge.bat\" and choose provider: gateway, azure, openai, ollama, or mock.\\n"
        "3. Launch the game, open Settings, enable LLM Agent mode, keep endpoint http://127.0.0.1:8787/resolve.\\n\\n"
        "Gateway example variables:\\n"
        "LLM_PROVIDER=gateway\\n"
        "LLM_BASE_URL=https://llm-api.example.com/OnPrem\\n"
        "LLM_MODEL=GPT-oss-20B\\n"
        "LLM_API_KEY=dummy\\n"
        "LLM_GATEWAY_SUBSCRIPTION_KEY=<your-subscription-key>\\n"
        "LLM_GATEWAY_USER=<your-user>\\n\\n"
        "Optional gateway path overrides:\\n"
        "LLM_CHAT_COMPLETIONS_PATH=v1/chat/completions\\n"
        "or LLM_CHAT_COMPLETIONS_URL=https://llm-api.example.com/OnPrem/chat/completions\\n\\n"
        "Azure OpenAI example variables:\\n"
        "LLM_PROVIDER=azure\\n"
        "AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com\\n"
        "AZURE_OPENAI_DEPLOYMENT=gpt-5.5\\n"
        "AZURE_OPENAI_API_VERSION=2025-01-01-preview\\n"
        "AZURE_OPENAI_API_KEY=<your-azure-key>\\n\\n"
        "If Windows SmartScreen appears, choose More info -> Run anyway.\\n",
    )

print(out)
print(f"{out.stat().st_size / (1024 * 1024):.1f} MB")
PY
