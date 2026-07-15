#!/usr/bin/env bash
set -euo pipefail
DESKTOP_DIR="$(cd "$(dirname "$0")/../../desktop" && pwd)"
cd "$DESKTOP_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required. Install from https://nodejs.org"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -f dist/server/index.js ]; then
  echo "Building desktop agent..."
  npm run build
fi

echo ""
echo "Alyson Desktop Agent -> http://127.0.0.1:8787"
echo "Return to Alyson CRM and click Connect Device."
echo ""
npm run start
