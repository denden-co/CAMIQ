#!/bin/bash
# Double-click me to quit ChatGPT Atlas and Comet so they stop
# interfering with the Claude-in-Chrome extension.

set -e

echo "Quitting ChatGPT Atlas…"
osascript -e 'tell application "ChatGPT Atlas" to quit' 2>/dev/null || true
# Force kill any stragglers
pkill -f "ChatGPT Atlas" 2>/dev/null || true

echo "Quitting Comet…"
osascript -e 'tell application "Comet" to quit' 2>/dev/null || true
pkill -f "Comet" 2>/dev/null || true

echo ""
echo "Done. Now go back to Google Chrome and reload localhost:3000."
echo "If the Claude extension is still flaky, open chrome://extensions"
echo "and disable any 'ChatGPT Atlas' or 'Comet' helper extensions."
echo ""
read -p "Press Return to close this window… " _
