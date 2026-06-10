#!/bin/bash
# Double-click me to start the CAMIQ backend with full debug logging.
# Output is saved to ~/Desktop/Cam/CAMIQ/api/uvicorn-debug.log
set -e
REPO="$HOME/Desktop/Cam/CAMIQ"
LOG="$REPO/api/uvicorn-debug.log"

cd "$REPO/api"
source .venv/bin/activate

echo "Python: $(python --version)" | tee "$LOG"
echo "Starting uvicorn with debug logging..." | tee -a "$LOG"
echo "Log file: $LOG" | tee -a "$LOG"
echo "---" | tee -a "$LOG"

# Run uvicorn in foreground, mirror output to both terminal and log file
uvicorn main:app --host 127.0.0.1 --port 8000 --log-level debug 2>&1 | tee -a "$LOG"

echo "" | tee -a "$LOG"
echo "=== UVICORN EXITED (code $?) ===" | tee -a "$LOG"
echo "Press any key to close..."
read -n 1
