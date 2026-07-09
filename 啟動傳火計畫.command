#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "找不到 Node.js，請先安裝 Node.js 18 或更新版本。"
  exit 1
fi
( sleep 1; open "http://localhost:3000" 2>/dev/null || true ) &
node server.js
