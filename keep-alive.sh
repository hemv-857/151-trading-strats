#!/bin/bash
cd /home/z/my-project
while true; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3000 2>/dev/null)
  if [ "$CODE" != "200" ]; then
    echo "[$(date)] Next.js down (HTTP $CODE), restarting..." >> keep-alive.log
    pkill -9 -f "next-server" 2>/dev/null
    pkill -9 -f "next dev" 2>/dev/null
    pkill -9 -f "bun run dev" 2>/dev/null
    sleep 3
    nohup bun run dev > dev.log 2>&1 &
    disown
    sleep 15
    echo "[$(date)] Next.js restarted, HTTP $(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://localhost:3000)" >> keep-alive.log
  fi
  # Also check yfinance service
  YCODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3001/api/health 2>/dev/null)
  if [ "$YCODE" != "200" ]; then
    echo "[$(date)] yfinance down (HTTP $YCODE), restarting..." >> keep-alive.log
    pkill -9 -f "yfinance-service" 2>/dev/null
    sleep 2
    nohup python3 mini-services/yfinance-service/index.py > mini-services/yfinance-service/service.log 2>&1 &
    disown
    sleep 3
    echo "[$(date)] yfinance restarted" >> keep-alive.log
  fi
  sleep 60
done
