#!/bin/bash
# Auto-restart the dev server if it dies
cd /home/z/my-project
while true; do
  # Check if next-server is running
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "[$(date)] next-server down, restarting..." >> /home/z/my-project/keep-alive.log
    pkill -9 -f "bun run dev" 2>/dev/null
    pkill -9 -f "next dev" 2>/dev/null
    sleep 2
    nohup bun run dev > /home/z/my-project/dev.log 2>&1 &
    disown
    sleep 12
    # Warm it up
    curl -s -o /dev/null --max-time 30 http://localhost:3000
    echo "[$(date)] restarted, HTTP $(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:3000)" >> /home/z/my-project/keep-alive.log
  fi
  sleep 30
done
