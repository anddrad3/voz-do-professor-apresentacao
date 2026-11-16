#!/bin/bash
# Voz do Professor — inicia a apresentação no Mac
cd "$(dirname "$0")"
xattr -dr com.apple.quarantine . 2>/dev/null
if [ "$(uname -m)" = "arm64" ]; then BIN="./sistema/voz-mac-arm64"; else BIN="./sistema/voz-mac-intel"; fi
chmod +x "$BIN" 2>/dev/null
"$BIN"
