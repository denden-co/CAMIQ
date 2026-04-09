#!/bin/bash
# Double-click me to launch CampaignIQ backend + frontend in two Terminal tabs.
set -e
REPO="$HOME/Desktop/Cam/CAMIQ"

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$REPO/api' && source .venv/bin/activate && echo '--- CAMIQ BACKEND (port 8000) ---' && uvicorn main:app --reload --port 8000"
    delay 1
    do script "cd '$REPO/frontend' && echo '--- CAMIQ FRONTEND (port 3000) ---' && npm run dev"
end tell
EOF
