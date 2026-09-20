#!/bin/bash
cd /home/z/my-project
while true; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://localhost:3000 2>/dev/null)
  if [ "$CODE" != "200" ]; then
    echo "[$(date)] server down (HTTP $CODE), restarting..." >> /home/z/my-project/keep-alive.log
    pkill -9 -f "next-server" 2>/dev/null
    pkill -9 -f "next dev" 2>/dev/null
    pkill -9 -f "bun run dev" 2>/dev/null
    sleep 3
    nohup bun run dev > /home/z/my-project/dev.log 2>&1 &
    disown
    sleep 15
    NEWCODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 http://localhost:3000 2>/dev/null)
    echo "[$(date)] restarted, HTTP $NEWCODE" >> /home/z/my-project/keep-alive.log
  fi
  sleep 60
done
