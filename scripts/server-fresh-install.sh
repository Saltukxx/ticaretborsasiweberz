#!/usr/bin/env bash
# Yeni sunucuda /opt/etb içinde çalıştırılır (deploy-fresh-server.ps1 tarafından çağrılır).
set -euo pipefail

cd /opt/etb

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker kuruluyor..."
  curl -fsSL https://get.docker.com | sh
fi

echo "Docker imajları yükleniyor..."
docker load -i etb-api.tar
docker load -i etb-frontend.tar
docker load -i etb-admin.tar

if [[ ! -f .env ]]; then
  echo "HATA: /opt/etb/.env bulunamadı"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

echo "Konteynerler başlatılıyor (db + cache)..."
docker compose -f docker-compose.server.yml up -d db cache

echo "Veritabanı hazır bekleniyor..."
for i in $(seq 1 60); do
  if docker compose -f docker-compose.server.yml exec -T db pg_isready -U etb -d etb >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

DB_CID="$(docker compose -f docker-compose.server.yml ps -q db)"

echo "Migration SQL dosyaları uygulanıyor..."
shopt -s nullglob
MIGRATIONS=(
  migrations/0000_eager_jack_murdock.sql
  migrations/0001_projects_showcase_fields.sql
  migrations/0002_map_districts.sql
  migrations/0003_events_showcase_fields.sql
  migrations/0004_corporate_cms.sql
  migrations/0005_stats_group_key.sql
  migrations/0006_leadership_message_title.sql
  migrations/0007_hero_content.sql
  migrations/0008_databank_sync.sql
  migrations/0009_price_entry_tescil_fields.sql
  migrations/0010_trust_compliance.sql
  migrations/0011_leadership_org_structure.sql
  migrations/0012_projects_legacy_content.sql
  migrations/0013_corporate_documents.sql
  migrations/0014_service_agreements.sql
  migrations/0015_corporate_document_body.sql
  migrations/0015_map_districts_twenty.sql
  migrations/0016_map_district_merkez.sql
  migrations/0017_map_hide_metro_districts.sql
)

for f in "${MIGRATIONS[@]}"; do
  if [[ -f "$f" ]]; then
    echo "  -> $f"
    docker exec -i "$DB_CID" psql -U etb -d etb -v ON_ERROR_STOP=1 < "$f"
  else
    echo "  ATLA (yok): $f"
  fi
done

mkdir -p videos

echo "Tüm servisler başlatılıyor..."
docker compose -f docker-compose.server.yml up -d

echo "API hazır bekleniyor..."
sleep 8

run_seed() {
  local script="$1"
  echo "  seed: $script"
  docker compose -f docker-compose.server.yml exec -T api node "dist/scripts/${script}.js" || echo "  UYARI: $script başarısız (devam)"
}

echo "Seed scriptleri..."
echo "  seed: seedSuperAdmin"
docker compose -f docker-compose.server.yml exec -T \
  -e "ADMIN_EMAIL=${ADMIN_EMAIL}" \
  -e "ADMIN_PASSWORD=${ADMIN_PASSWORD}" \
  -e "ADMIN_NAME=${ADMIN_NAME:-Super_Admin}" \
  api node dist/scripts/seedSuperAdmin.js || echo "  UYARI: seedSuperAdmin başarısız (devam)"

run_seed seedMapDistricts
run_seed seedCorporate
run_seed seedProjectsImpactStats
run_seed seedLeadershipMessageTitle
run_seed seedGeoIndications
run_seed seedHero
run_seed seedLeadershipPresident
run_seed seedLegalPages
run_seed seedCorporateDocuments
run_seed seedCorporateBodies
run_seed seedServiceAgreements

echo "Proje içerikleri (admin oluşturulduktan sonra)..."
docker exec -i "$DB_CID" psql -U etb -d etb -v ON_ERROR_STOP=1 \
  < migrations/0012_projects_legacy_content.sql || echo "  UYARI: proje seed atlandı"

echo ""
echo "=== Kurulum tamamlandı ==="
docker compose -f docker-compose.server.yml ps
echo ""
echo "Site:    http://${PUBLIC_HOST:-SUNUCU_IP}/"
echo "Admin:   http://${PUBLIC_HOST:-SUNUCU_IP}:8080/"
echo "Admin:   ${ADMIN_EMAIL} / (deploy çıktısındaki şifre)"
