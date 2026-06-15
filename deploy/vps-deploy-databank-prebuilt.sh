#!/bin/bash
# Run on VPS after upload: etb-api-prebuilt.tgz, 0008_databank_sync.sql
# Does NOT run tsc on server (avoids OOM on small droplets).
set -euo pipefail
cd /opt/etb

echo "==> Stop stuck builds (if any)"
pkill -f 'docker build' 2>/dev/null || true
docker builder prune -f 2>/dev/null || true

echo "==> Extract prebuilt API"
rm -rf api-build
mkdir -p api-build
tar -xzf etb-api-prebuilt.tgz -C api-build
cd api-build
docker build -f Dockerfile.prebuilt -t etb-api:latest .

echo "==> Migration 0008"
docker compose -f /opt/etb/docker-compose.server.yml exec -T db \
  psql -U etb -d etb -v ON_ERROR_STOP=1 < /opt/etb/0008_databank_sync.sql \
  || echo "Migration may already be applied"

echo "==> DataBank env"
ENV_BLOCK='
# DataBank hourly sync
DATABANK_SYNC_ENABLED=true
DATABANK_HOURLY_SYNC=true
DATABANK_SYNC_CRON=5 * * * *
DATABANK_SYNC_SECTIONS=home,tescil
DATABANK_TESCIL_BACKFILL_DAYS=0
DATABANK_REQUEST_DELAY_MS=2000
'
if ! grep -q DATABANK_SYNC_ENABLED /opt/etb/.env 2>/dev/null; then
  printf '%s\n' "$ENV_BLOCK" >> /opt/etb/.env
fi

echo "==> Restart API"
cd /opt/etb
docker compose -f docker-compose.server.yml up -d api --force-recreate

echo "==> Wait for API"
sleep 5
docker compose -f docker-compose.server.yml logs api --tail 30

echo "==> Done. Cron should log: DataBank hourly cron scheduled"
