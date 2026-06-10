#!/bin/bash
# Quick restart: kill old backend, start fresh
REPO="$HOME/Desktop/Cam/CAMIQ"
cd "$REPO/api"

# Kill anything on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 1

source .venv/bin/activate
echo "---- CAMIQ BACKEND (port 8000) ----"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level info
