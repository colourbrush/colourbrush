#!/bin/bash
# Double-click this file in Finder to launch Showrunner on your Mac.
cd "$(dirname "$0")"
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is required. Install it with:  brew install node   (or from https://nodejs.org)"
  read -r -p "Press Enter to close"
  exit 1
fi
[ -d node_modules ] || npm install
(sleep 2 && open http://localhost:5173) &
npm run dev
