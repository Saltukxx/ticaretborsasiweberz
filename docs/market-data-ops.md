# Market data operations (admin → public site)

Daily workflow for **commodity prices**, **FX rates**, and **homepage stats** that power `/piyasa-verileri`, `/fiyat-bulteni`, and the home page KPI strip.

Coğrafi işaretler are **not** part of this flow—they are managed under admin **Coğrafi işaretler** and served via `GET /api/v1/geo-indications`. Initial catalog can be loaded with `seedGeoIndications.js` (see `DEPLOY.md`).

## 1. Products (Ürünler)

1. Open admin → **Fiyatlar** → **Ürünler**.
2. Each row needs: `slug`, name, category, unit (e.g. `₺/kg`), active flag, sort order.
3. Slugs must match URL-safe patterns (`bugday`, `arpa`, …)—used in `/api/v1/prices/history/:productSlug`.

## 2. Daily price entries (Fiyat satırları)

1. **Fiyatlar** → **Fiyat satırları**.
2. For each product and **session date** (`entry_date`, `YYYY-MM-DD`), enter:
   - `avg_price`, `low_price`, `high_price`
   - optional `change_pct`, `volume`, `volume_unit`, `session_time`
3. One row per product per day (upsert on duplicate date).

### Bulk import (JSON)

**Fiyatlar** → **Toplu (JSON)**. Array of objects:

```json
[
  {
    "productSlug": "bugday",
    "entryDate": "2026-05-19",
    "avgPrice": "12.84",
    "lowPrice": "11.95",
    "highPrice": "13.42",
    "changePct": "1.8",
    "volume": "284.5",
    "volumeUnit": "ton"
  }
]
```

`POST /api/v1/admin/prices/bulk` upserts by product + date. After save, Redis cache for `/prices/current` and `/prices/bulletin` is cleared (within ~5 minutes if Redis is down).

## 3. FX rates (Döviz kurları)

1. Admin → **Döviz kurları**.
2. Add rows with `code`, optional `label`, `rateValue`, optional `changePct` / `direction`.
3. Public ticker: `GET /api/v1/currency-rates`.

## 4. Stats snapshot (İstatistikler)

1. Admin → **İstatistikler**.
2. Each KPI: `label`, numeric `value`, optional `suffix`, optional `note`, `sortOrder`.
3. Public: `GET /api/v1/stats` → `QuickStats` on the home page.

## 5. Public API reference

| Endpoint | Use |
|----------|-----|
| `GET /api/v1/prices/current` | Latest price per active product + 10-point sparkline |
| `GET /api/v1/prices/bulletin` | All products for latest session date |
| `GET /api/v1/prices/history/:slug?period=7d\|30d\|90d\|365d` | Detail charts on fiyat bülteni |
| `GET /api/v1/currency-rates` | Live market strip |
| `GET /api/v1/stats` | Homepage KPI cards |

## 6. Data quality (fiyat bülteni)

Sync ve API katmanlarında:

- **Doğrulama:** `low ≤ avg ≤ high`, pozitif fiyatlar, bozuk Türkçe isimler, aşırı değerler elenir (`validate.ts`).
- **Günlük değişim %:** Önceki seans ortalamasına göre hesaplanır; yoksa UI `—` gösterir (0% uydurulmaz).
- **Yayın:** Yalnızca geçerli fiyat satırları `/prices/current` ve `/prices/bulletin` ile döner.

## 7. DataBank otomatik senkron (scrape)

Kaynak: [https://borsa.erzurumtb.org.tr/web/data/](https://borsa.erzurumtb.org.tr/web/data/) — resmi API yok; backend HTML tablolarını çeker.

### Ortam değişkenleri (`backend/.env`)

```env
DATABANK_BASE_URL=https://borsa.erzurumtb.org.tr/web/data/
DATABANK_SYNC_ENABLED=true
DATABANK_REQUEST_DELAY_MS=2000
DATABANK_TESCIL_BACKFILL_DAYS=0
DATABANK_SYNC_SECTIONS=home,tescil
DATABANK_PRICE_SOURCE_PRIORITY=tescil,home
DATABANK_HOURLY_SYNC=true
DATABANK_SYNC_CRON=5 * * * *
SYNC_ADMIN_EMAIL=sync@etb.internal
```

- `DATABANK_HOURLY_SYNC=true` — API açılışında node-cron ile saatlik senkron (varsayılan: sync açıksa açık).
- `DATABANK_SYNC_CRON` — cron ifadesi (varsayılan `5 * * * *` = her saat xx:05).
- `home` — ana tablo (tüm gruplar, tek POST).
- `tescil` — günlük tescil bülteni (`CAPNO=D`); site bülteni için öncelikli kaynak.
- `charts` / `volume` — aylık grafik ve hacim arşivi (uzun koşu; `DATABANK_SYNC_SECTIONS` ile açın).

### Komutlar (`backend/`)

```bash
npm run sync:databank:poc    # PoC + fixture HTML
npm run test:databank        # Parser testleri
npm run sync:databank        # Tam senkron (DB gerekir)
npm run sync:databank -- --dry-run
npm run sync:databank -- --sections=home,tescil,charts
```

### Admin

**Piyasa → DataBank senkron** (super admin): manuel tetik ve son koşu listesi.

API: `POST /api/v1/admin/sync/databank/trigger`, `GET /api/v1/admin/sync/databank/runs`.

### Slug kuralları

Ürün + satış şekli + taraf: `bugday-hts-satis`, `bugday-hts-alis`. Tescil günlük satırları varsayılan olarak `-satis` slug’ına yazılır.

### Saatlik senkron (önerilen)

API container içinde `node-cron` (env: `DATABANK_HOURLY_SYNC=true`). Ek sunucu cron gerekmez.

İsteğe bağlı host yedek: `deploy/databank-sync-hourly.sh` → `5 * * * *` crontab.

Migration: `0008_databank_sync.sql` (`databank_sync_runs`, `price_history_monthly`, `market_volume_monthly`).

### Bülten API notları

- `GET /api/v1/prices/bulletin` — yalnızca son seans tarihindeki satırlar (~20–30 ürün); sparkline dahil, Redis TTL 5 dk.
- `GET /api/v1/prices/current` — ürün başına en son fiyat (tüm katalog); bülten sayfası artık bunu çekmez.
- **Alış** satırlarında `transaction_amount` / `transaction_count` genelde boş (kaynak: ana tablo). **Satış** tescil satırlarında dolu olabilir.
- `change_pct` önceki seans ortalamasına göre hesaplanır; yeni kurulumda birkaç günlük sync sonrası dolar.

## 7. VPS deploy notes

- Set `COOKIE_SECURE=false` in `/opt/etb/.env` when serving over HTTP (admin refresh cookies).
- Rebuild frontend with `VITE_API_URL` pointing at the API origin (see `DEPLOY.md`).
- After API deploy, price changes appear on the site after cache TTL (~5 min) or immediately when Redis cache keys are invalidated on write.
