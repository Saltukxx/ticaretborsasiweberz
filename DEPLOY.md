# Deployment Guide

## Yeni sunucuya sıfırdan kurulum (önerilen)

Eski sunucu (`139.59.156.88`) gerekmez. Yeni bir Ubuntu VPS + root SSH yeterli.

```powershell
cd C:\Users\satog\OneDrive\Desktop\ticaretborsasi

# Yeni sunucu IP'sini yazın
.\scripts\deploy-fresh-server.ps1 -ServerIp "YENI_IP_ADRESI"

# İsteğe bağlı: Gemini + özel admin
.\scripts\deploy-fresh-server.ps1 -ServerIp "YENI_IP_ADRESI" `
  -AdminEmail "admin@erzurumtb.org.tr" `
  -GeminiApiKey "AIza..."
```

Script otomatik yapar: Docker imaj build, DB migration (0000–0017), seed, admin hesabı, Kadayıf videosu, `.env` (JWT/DB şifreleri).

| Servis | URL |
|--------|-----|
| Site | `http://YENI_IP/` |
| Admin | `http://YENI_IP:8080/` |
| Kadayıf | `http://YENI_IP/cografi-isaretler/kadayif-dolmasi` |

**DigitalOcean:** Ubuntu 22.04/24.04, min 2 GB RAM, firewall **22, 80, 8080** açık.

---

Server IP: `5.180.186.186` (aktif)

---

## 1. Build Docker Images (local)

```powershell
cd C:\Users\satog\OneDrive\Desktop\ticaretborsasi

docker build -t etb-api:latest ./backend
docker build -t etb-frontend:latest --build-arg VITE_API_URL=http://139.59.156.88 --build-arg VITE_SAME_ORIGIN_API=true .
docker build -t etb-admin:latest --build-arg VITE_API_URL=http://139.59.156.88:8080 --build-arg VITE_SAME_ORIGIN_API=true ./admin-panel
```

## 2. Export to Tar Files (local)

```powershell
docker save etb-api:latest -o etb-api.tar
docker save etb-frontend:latest -o etb-frontend.tar
docker save etb-admin:latest -o etb-admin.tar
```

## 3. Transfer to Server (local)

```powershell
scp -i "$HOME\.ssh\id_rsa_etb" etb-api.tar etb-frontend.tar etb-admin.tar docker-compose.server.yml `
  backend\src\db\migrations\0000_eager_jack_murdock.sql `
  backend\src\db\migrations\0001_projects_showcase_fields.sql `
  backend\src\db\migrations\0002_map_districts.sql `
  backend\src\db\migrations\0003_events_showcase_fields.sql `
  backend\src\db\migrations\0004_corporate_cms.sql `
  backend\src\db\migrations\0005_stats_group_key.sql `
  backend\src\db\migrations\0006_leadership_message_title.sql `
  backend\src\db\migrations\0007_hero_content.sql `
  backend\src\db\migrations\0008_databank_sync.sql `
  backend\src\db\migrations\0009_price_entry_tescil_fields.sql `
  backend\src\db\migrations\0010_trust_compliance.sql `
  backend\src\db\migrations\0011_leadership_org_structure.sql `
  backend\src\db\migrations\0012_projects_legacy_content.sql `
  root@139.59.156.88:/opt/etb/
```

## 4. Server Setup (run once via DigitalOcean console or SSH)

```bash
ssh -i ~/.ssh/id_rsa_etb root@139.59.156.88

# Install Docker
curl -fsSL https://get.docker.com | sh

# Load images
cd /opt/etb
docker load -i etb-api.tar
docker load -i etb-frontend.tar
docker load -i etb-admin.tar

# Create .env
cat > .env <<EOF
DATABASE_URL=postgresql://etb:etb@db:5432/etb
REDIS_URL=redis://cache:6379
JWT_SECRET=replace-with-a-long-random-secret-min-32-chars
NODE_ENV=production
BASE_URL=http://139.59.156.88
UPLOADS_DIR=/app/uploads
COOKIE_SECURE=false
ALLOWED_ORIGINS=http://139.59.156.88,http://139.59.156.88:8080
# GEMINI_API_KEY=your-google-ai-key
# GEMINI_MODEL=gemini-2.5-flash
EOF
# BASE_URL: public URL for PDFs saved on server disk (/app/uploads, volume etb_uploads).
# GEMINI_API_KEY: optional; powers POST /api/v1/recipe-chat on the Kadayıf interactive page.
# PDFs are always stored locally; images may use R2 when configured.
# Frontend/admin nginx proxy /api and /uploads to the api container (same-origin downloads).

# Start all services
docker compose -f docker-compose.server.yml up -d

# Run database migrations (initial schema + incremental updates)
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0000_eager_jack_murdock.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0001_projects_showcase_fields.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0002_map_districts.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0003_events_showcase_fields.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0004_corporate_cms.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0005_stats_group_key.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0006_leadership_message_title.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0007_hero_content.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0008_databank_sync.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0009_price_entry_tescil_fields.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0010_trust_compliance.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0011_leadership_org_structure.sql
docker exec -i $(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < /opt/etb/0012_projects_legacy_content.sql

# Seed CMS defaults (run inside api container after migrations)
docker compose -f docker-compose.server.yml exec api node dist/scripts/seedMapDistricts.js
docker compose -f docker-compose.server.yml exec api node dist/scripts/seedCorporate.js
docker compose -f docker-compose.server.yml exec api node dist/scripts/seedProjectsImpactStats.js
docker compose -f docker-compose.server.yml exec api node dist/scripts/seedLeadershipMessageTitle.js
# Optional â€” first-time geo catalog (~62 rows)
docker compose -f docker-compose.server.yml exec api node dist/scripts/seedGeoIndications.js
docker compose -f docker-compose.server.yml exec api node dist/scripts/seedHero.js
docker compose -f docker-compose.server.yml exec api node dist/scripts/seedLeadershipPresident.js
docker compose -f docker-compose.server.yml exec api node dist/scripts/seedLegalPages.js

# Seed super admin
docker compose -f docker-compose.server.yml exec api node dist/scripts/seedSuperAdmin.js
```

## 5. URLs

| Service    | URL                              |
|------------|----------------------------------|
| Frontend   | http://139.59.156.88             |
| Admin panel| http://139.59.156.88:8080        |
| API        | http://139.59.156.88:3001        |

---

## HTTPS (domain hazÄ±r olunca)


### Production VPS status

- **IP:** `139.59.156.88` — site still **HTTP only** until a domain is configured.
- **HTTPS prep:** `/opt/etb/deploy/prep-https.sh` has been run (certbot + nginx installed; host nginx **disabled** so Docker keeps ports 80/8080).
- **Blocker:** No hostname in repo or `/opt/etb/.env` (only IP). Let's Encrypt cannot issue certs for the bare IP.
- **You must:** Create DNS **A** records to `139.59.156.88`, then run `enable-https.sh` with your real hostnames and rebuild frontend/admin images (see below).
Chrome **â€œinsecure downloadâ€** uyarÄ±sÄ±, sitenin HTTP olmasÄ±ndan kaynaklanÄ±r. KalÄ±cÄ± Ã§Ã¶zÃ¼m: domain + Letâ€™s Encrypt.

### A. Sunucuda hazÄ±rlÄ±k (domain gerekmez â€” bir kez)

Repoâ€™daki `deploy/` klasÃ¶rÃ¼nÃ¼ sunucuya kopyalayÄ±n ve prep scriptâ€™ini Ã§alÄ±ÅŸtÄ±rÄ±n:

```powershell
scp -i "$HOME\.ssh\id_rsa_etb" -r deploy root@139.59.156.88:/opt/etb/
```

```bash
ssh -i ~/.ssh/id_rsa_etb root@139.59.156.88
chmod +x /opt/etb/deploy/prep-https.sh /opt/etb/deploy/enable-https.sh
/opt/etb/deploy/prep-https.sh
```

Bu adÄ±m: `nginx`, `certbot`, `/var/www/certbot` kurar; **host nginx kapalÄ± kalÄ±r** â€” mevcut HTTP (Docker 80 / 8080) aynen Ã§alÄ±ÅŸÄ±r.

### B. Domain alÄ±ndÄ±ktan sonra (DNS ÅŸart)

1. DNS kayÄ±tlarÄ± (A â†’ `139.59.156.88`):
   - `etb.ornekdomain.com` (veya kÃ¶k domain)
   - `www.etb.ornekdomain.com` (isteÄŸe baÄŸlÄ±, script www iÃ§in de sertifika ister)
   - `admin.etb.ornekdomain.com` (admin panel; farklÄ± alt alan adÄ± da verilebilir)

2. Sunucuda:

```bash
/opt/etb/deploy/enable-https.sh etb.ornekdomain.com admin.etb.ornekdomain.com sizin@email.com
```

Script: Dockerâ€™Ä± `127.0.0.1:9080` / `9081`â€™e alÄ±r, host nginx ile TLS aÃ§ar, `.env` iÃ§inde `BASE_URL` ve `COOKIE_SECURE` gÃ¼nceller.

3. Yerelde imajlarÄ± HTTPS ile yeniden build edip yÃ¼kleyin:

```powershell
docker build -t etb-frontend:latest --build-arg VITE_API_URL=https://etb.ornekdomain.com --build-arg VITE_SAME_ORIGIN_API=true .
docker build -t etb-admin:latest --build-arg VITE_API_URL=https://admin.etb.ornekdomain.com --build-arg VITE_SAME_ORIGIN_API=true ./admin-panel
# ardÄ±ndan tar export + scp + docker load (bkz. Redeployment)
```

| Service (HTTPS sonrasÄ±) | URL |
|-------------------------|-----|
| Frontend | `https://etb.ornekdomain.com` |
| Admin | `https://admin.etb.ornekdomain.com` |
| PDF indirme | `https://etb.ornekdomain.com/api/v1/reports/{slug}/download` |

Sertifika yenileme: `certbot renew` (paket genelde gÃ¼nlÃ¼k cron kurar).

---

## PDF reports (admin â†’ public download)

1. Admin panel â†’ **Raporlar** â†’ **Yeni rapor**
2. **PDF seÃ§ veya yÃ¼kle** (en fazla 50 MB; `.pdf` uzantÄ±lÄ± dosya)
3. Meta alanlarÄ±nÄ± doldurup **Kaydet**, ardÄ±ndan **YayÄ±nla**
4. ZiyaretÃ§iler `http://139.59.156.88/raporlar` Ã¼zerinden **PDF Ä°ndir** ile dosyayÄ± alÄ±r

**Sunucuda saklama:** PDF dosyalarÄ± her zaman API konteynerindeki `/app/uploads` dizinine yazÄ±lÄ±r (`etb_uploads` Docker volume â€” yeniden deploy sonrasÄ± da kalÄ±r). Ä°ndirme adresi: `GET /api/v1/reports/{slug}/download` (`Content-Disposition: attachment`).

**Ã–nemli:** `.env` iÃ§inde `BASE_URL=http://139.59.156.88` olmalÄ± (port `:3001` deÄŸil). Site ve admin nginx, `/api` ve `/uploads` isteklerini APIâ€™ye proxy eder.

---

## Market data (admin)

See [docs/market-data-ops.md](docs/market-data-ops.md) for the daily workflow: products, price rows, FX, and stats.

---

## Redeployment (after code changes)

```powershell
# Rebuild changed images
docker build -t etb-api:latest ./backend
docker build -t etb-frontend:latest --build-arg VITE_API_URL=http://139.59.156.88 --build-arg VITE_SAME_ORIGIN_API=true .
docker build -t etb-admin:latest --build-arg VITE_API_URL=http://139.59.156.88:8080 --build-arg VITE_SAME_ORIGIN_API=true ./admin-panel

# Re-export
docker save etb-api:latest -o etb-api.tar
docker save etb-frontend:latest -o etb-frontend.tar
docker save etb-admin:latest -o etb-admin.tar

# Re-upload
scp -i "$HOME\.ssh\id_rsa_etb" etb-api.tar etb-frontend.tar etb-admin.tar root@139.59.156.88:/opt/etb/

# Upload new migrations when schema changed (skip files already applied)
scp -i "$HOME\.ssh\id_rsa_etb" backend\src\db\migrations\0002_map_districts.sql `
  backend\src\db\migrations\0003_events_showcase_fields.sql `
  backend\src\db\migrations\0004_corporate_cms.sql `
  backend\src\db\migrations\0005_stats_group_key.sql `
  backend\src\db\migrations\0006_leadership_message_title.sql `
  backend\src\db\migrations\0007_hero_content.sql `
  backend\src\db\migrations\0008_databank_sync.sql `
  backend\src\db\migrations\0009_price_entry_tescil_fields.sql `
  backend\src\db\migrations\0010_trust_compliance.sql `
  backend\src\db\migrations\0011_leadership_org_structure.sql `
  backend\src\db\migrations\0012_projects_legacy_content.sql `
  root@139.59.156.88:/opt/etb/

# On server â€” reload, migrate, seed, restart
ssh -i "$HOME\.ssh\id_rsa_etb" root@139.59.156.88 @"
cd /opt/etb
docker load -i etb-api.tar && docker load -i etb-frontend.tar && docker load -i etb-admin.tar
docker compose -f docker-compose.server.yml up -d
for f in 0002_map_districts.sql 0003_events_showcase_fields.sql 0004_corporate_cms.sql 0005_stats_group_key.sql 0006_leadership_message_title.sql 0007_hero_content.sql 0008_databank_sync.sql 0009_price_entry_tescil_fields.sql 0010_trust_compliance.sql 0011_leadership_org_structure.sql 0012_projects_legacy_content.sql; do
  [ -f \"\$f\" ] && docker exec -i \$(docker compose -f docker-compose.server.yml ps -q db) psql -U etb -d etb < \"\$f\" || true
done
docker compose -f docker-compose.server.yml exec -T api node dist/scripts/seedMapDistricts.js
docker compose -f docker-compose.server.yml exec -T api node dist/scripts/seedCorporate.js
docker compose -f docker-compose.server.yml exec -T api node dist/scripts/seedProjectsImpactStats.js
docker compose -f docker-compose.server.yml exec -T api node dist/scripts/seedLeadershipMessageTitle.js
docker compose -f docker-compose.server.yml exec -T api node dist/scripts/seedGeoIndications.js
docker compose -f docker-compose.server.yml exec -T api node dist/scripts/seedHero.js
docker compose -f docker-compose.server.yml exec -T api node dist/scripts/seedLegalPages.js
"@
# Note: the etb_uploads Docker volume persists uploaded files across redeployments.
```

### DataBank fiyat senkronu

`borsa.erzurumtb.org.tr/web/data` sitesinden otomatik scrape. `/opt/etb/.env` örneği:

```env
DATABANK_SYNC_ENABLED=true
DATABANK_HOURLY_SYNC=true
DATABANK_SYNC_CRON=5 * * * *
DATABANK_SYNC_SECTIONS=home,tescil
DATABANK_TESCIL_BACKFILL_DAYS=0
```

Saatlik çekim API içinde çalışır (container yeniden başlayınca cron yeniden kurulur). Manuel: `docker compose -f /opt/etb/docker-compose.server.yml exec -T api npm run sync:databank`

Admin: **DataBank senkron** (`/databank-sync`, super admin). Ayrıntı: `docs/market-data-ops.md`.

### Ana sayfa hero

Admin panel â†’ **Ana sayfa hero** (`/hero-content`). Ä°lk kayÄ±t yoksa `seedHero.js` mevcut metinleri yazar. Public: `GET /api/v1/hero`.

### BaÅŸkanÄ±n mesajÄ±

Admin panel â†’ **BaÅŸkanÄ±n mesajÄ±** (`/president-message`). Portre iÃ§in medya kÃ¼tÃ¼phanesinden gÃ¶rsel seÃ§in veya yÃ¼kleyin. Ä°lk kurulum: `seedLeadershipPresident.js` (metin + `public/images/baskan-portre.png`). Public: `GET /api/v1/leadership/president`.

### CoÄŸrafi iÅŸaret gÃ¶rselleri

Ã–ne Ã§Ä±kan Ã¼rÃ¼n kapaklarÄ± APIâ€™de yoksa frontend `src/lib/geoFallbackImages.ts` iÃ§indeki KÃ¼ltÃ¼r PortalÄ± URLâ€™lerini kullanÄ±r. KalÄ±cÄ± gÃ¶rseller iÃ§in admin panelden ilgili kayda kapak yÃ¼kleyin; API `coverUrl` dÃ¶ndÃ¼ÄŸÃ¼nde fallback devre dÄ±ÅŸÄ± kalÄ±r.
