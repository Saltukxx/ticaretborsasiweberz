#!/bin/sh
# Optional host cron fallback (API içi cron tercih edilir).
# Saat başı (dakika 5): 5 * * * * /opt/etb/databank-sync-hourly.sh >> /var/log/etb-databank-sync.log 2>&1
set -eu
cd /opt/etb
/usr/bin/docker compose -f docker-compose.server.yml exec -T api npm run sync:databank
