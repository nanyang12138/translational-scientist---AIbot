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
    z.writestr(
        "README.txt",
        "God Is Offline / 神已离线\\n\\n"
        "Windows portable build exported with Godot 4.2.2.\\n"
        "Unzip this archive, then double-click \"God Is Offline.exe\" to run.\\n\\n"
        "If Windows SmartScreen appears, choose More info -> Run anyway.\\n",
    )

print(out)
print(f"{out.stat().st_size / (1024 * 1024):.1f} MB")
PY
