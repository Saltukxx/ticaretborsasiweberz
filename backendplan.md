# Erzurum Ticaret Borsası — Backend Architecture Plan

> **Scope:** Production-grade REST API backend + admin panel for the Erzurum Ticaret Borsası website.  
> **Date:** May 2026  
> **Author:** Architecture review for `erzurum-ticaret-borsasi` codebase  

---

## 1. Executive Summary

The current frontend is a static React/TypeScript/Vite SPA with all data hardcoded in TypeScript files. The goal is to replace every hardcoded data source with a real database, expose a versioned REST API for the public frontend to consume, and provide a secure, role-based admin panel so staff can manage news, announcements, commodity prices, events, reports, projects, services, geographical indications, and leadership content without touching code.

**Key engineering decisions:**

| Decision | Choice | Rationale |
|---|---|---|
| Architecture | Modular Monolith | Small team, single domain, no justification for microservices complexity yet |
| Language | Node.js + TypeScript | Same ecosystem as frontend; mature ecosystem for HTTP APIs |
| Framework | **Fastify v5** | 3× faster than Express, TypeScript-native, schema validation built in |
| ORM | **Drizzle ORM** | TypeScript-first, zero-overhead query builder, excellent migrations |
| Primary DB | **PostgreSQL 16** | ACID, JSONB, full-text search (Turkish), mature, battle-tested |
| Cache | **Redis 7** | Price data TTL caching, session store, rate limiting |
| File storage | **Cloudflare R2** (S3-compatible) | Cost-effective (no egress fees), S3 SDK compatible |
| Admin panel | **Custom React SPA** (separate Vite app) | Full control; avoids CMS lock-in |
| Auth | **JWT + Refresh Tokens** (HttpOnly cookies) | Stateless access tokens, secure refresh flow |
| Deployment | **Docker + docker-compose** → Railway / Render / VPS | Simple, portable, fits institution budget |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              INTERNET                               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Nginx     │  TLS termination, gzip,
                    │  (reverse   │  static asset serving,
                    │   proxy)    │  rate limiting (limit_req)
                    └──────┬──────┘
          ┌────────────────┼────────────────────┐
          │                │                    │
   ┌──────▼──────┐  ┌──────▼──────┐   ┌────────▼──────┐
   │  Public     │  │  Admin SPA  │   │  Fastify API  │
   │  React SPA  │  │  React SPA  │   │  (Node.js)    │
   │  (Vite SSG) │  │  (Vite)     │   │  Port 3001    │
   └─────────────┘  └─────────────┘   └──────┬────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                       ┌──────▼──────┐ ┌────▼────┐  ┌──────▼──────┐
                       │ PostgreSQL  │ │  Redis  │  │Cloudflare R2│
                       │   (Primary) │ │  Cache  │  │  (Files)    │
                       │ + Replica   │ │  + Rate │  │             │
                       └─────────────┘ └─────────┘  └─────────────┘
```

### Request flow (public frontend)

1. React app calls `GET /api/v1/news?limit=10`
2. Nginx forwards to Fastify API
3. Fastify checks Redis cache → **hit**: return immediately (< 2 ms)
4. Cache **miss**: query PostgreSQL → store in Redis (TTL 15 min) → return
5. Prices endpoint TTL: 5 minutes (updated several times per day)

### Request flow (admin)

1. Admin logs in → POST `/api/v1/admin/auth/login`
2. API sets `refresh_token` in HttpOnly Secure cookie, returns short-lived JWT in response body
3. Admin SPA stores JWT in memory (never localStorage)
4. All mutating requests include `Authorization: Bearer <jwt>` header
5. JWT expires in 15 min → SPA uses silent refresh (cookie-based) to get new token

---

## 3. Repository Structure

```
erzurum-ticaret-borsasi/       ← existing repo (frontend)
backend/                        ← new directory
├── src/
│   ├── server.ts               ← Fastify instance, plugin registration
│   ├── config.ts               ← env validation (zod)
│   ├── db/
│   │   ├── connection.ts       ← pg pool + drizzle instance
│   │   ├── schema/             ← one file per domain
│   │   │   ├── admins.ts
│   │   │   ├── news.ts
│   │   │   ├── announcements.ts
│   │   │   ├── prices.ts
│   │   │   ├── events.ts
│   │   │   ├── reports.ts
│   │   │   ├── projects.ts
│   │   │   ├── services.ts
│   │   │   ├── geographicalIndications.ts
│   │   │   ├── leadership.ts
│   │   │   └── media.ts
│   │   └── migrations/         ← drizzle-kit generated SQL
│   ├── modules/                ← feature-sliced
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts  ← zod/fastify JSON schemas
│   │   ├── news/
│   │   ├── announcements/
│   │   ├── prices/
│   │   ├── events/
│   │   ├── reports/
│   │   ├── projects/
│   │   ├── services/
│   │   ├── geo-indications/
│   │   ├── leadership/
│   │   └── media/
│   ├── plugins/
│   │   ├── authenticate.ts     ← JWT verify decorator
│   │   ├── rateLimit.ts
│   │   ├── redis.ts
│   │   └── cors.ts
│   ├── lib/
│   │   ├── cache.ts            ← Redis cache helpers
│   │   ├── storage.ts          ← R2 upload helpers
│   │   ├── audit.ts            ← audit log writer
│   │   └── turkish-search.ts  ← PostgreSQL Turkish FTS helpers
│   └── types/
│       └── fastify.d.ts        ← augment FastifyRequest with user
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example

admin-panel/                    ← new Vite React app
├── src/
│   ├── api/                    ← typed fetch clients (openapi-ts generated)
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── news/               ← list, create, edit
│   │   ├── announcements/
│   │   ├── prices/
│   │   ├── events/
│   │   ├── reports/
│   │   ├── media/
│   │   └── settings/
│   └── components/
│       ├── DataTable.tsx       ← reusable sortable/filterable table
│       ├── RichTextEditor.tsx  ← Tiptap editor (Turkish spell check)
│       └── MediaPicker.tsx
└── package.json
```

---

## 4. Database Schema

**Database: PostgreSQL 16**  
**ORM: Drizzle ORM** (TypeScript schema-as-code, type-safe queries)  
**Conventions:**
- `id`: UUID v4 (`gen_random_uuid()`) — portable, safe for distributed future
- `created_at` / `updated_at`: `TIMESTAMPTZ` (always with timezone)
- `deleted_at`: soft-delete column on all content tables
- `slug`: URL-safe identifier for public-facing resources

---

### 4.1 `admins`

```sql
CREATE TABLE admins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,           -- bcrypt 12 rounds
  name            VARCHAR(255) NOT NULL,
  role            VARCHAR(50) NOT NULL DEFAULT 'editor', -- 'super_admin' | 'editor'
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admins_email ON admins(email);
```

**Roles:**
- `super_admin` — full access, can manage other admins, system settings
- `editor` — can create/edit/delete content; cannot manage admins or delete published news

---

### 4.2 `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash   VARCHAR(255) NOT NULL UNIQUE,  -- SHA-256 hash of actual token
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_admin   ON refresh_tokens(admin_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

---

### 4.3 `news` (Haberler)

```sql
CREATE TABLE news (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(255) UNIQUE NOT NULL,
  title         VARCHAR(500) NOT NULL,
  excerpt       TEXT NOT NULL,
  body          TEXT NOT NULL,                 -- HTML from Tiptap editor
  category      VARCHAR(100) NOT NULL,         -- 'Haber' | 'Sektör' | 'Basın Açıklaması' …
  tone          VARCHAR(50) NOT NULL,          -- 'haber' | 'duyuru' | 'etkinlik' …
  is_featured   BOOLEAN NOT NULL DEFAULT false, -- replaces the "big" flag
  cover_image   UUID REFERENCES media(id),
  published_at  TIMESTAMPTZ,                   -- NULL = draft; set = published
  created_by    UUID NOT NULL REFERENCES admins(id),
  updated_by    UUID REFERENCES admins(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ,
  search_vector TSVECTOR                       -- populated by trigger (Turkish FTS)
);

CREATE INDEX idx_news_published   ON news(published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_news_category    ON news(category)          WHERE deleted_at IS NULL;
CREATE INDEX idx_news_slug        ON news(slug);
CREATE INDEX idx_news_search      ON news USING GIN (search_vector);

-- Auto-update search_vector on insert/update
CREATE TRIGGER news_search_vector_update
BEFORE INSERT OR UPDATE ON news
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.turkish', title, excerpt, body);
```

---

### 4.4 `announcements` (Duyurular)

```sql
CREATE TABLE announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(255) UNIQUE NOT NULL,
  title        VARCHAR(500) NOT NULL,
  body         TEXT NOT NULL,
  is_ticker    BOOLEAN NOT NULL DEFAULT false,  -- show in the scrolling ticker strip
  priority     SMALLINT NOT NULL DEFAULT 0,     -- higher = shown first in ticker
  published_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,                     -- auto-hide after this date
  created_by   UUID NOT NULL REFERENCES admins(id),
  updated_by   UUID REFERENCES admins(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_announcements_active ON announcements(published_at DESC, expires_at)
  WHERE deleted_at IS NULL;
```

---

### 4.5 `commodity_products`

```sql
CREATE TABLE commodity_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(100) UNIQUE NOT NULL,  -- 'bugday', 'arpa', …
  name        VARCHAR(255) NOT NULL,         -- 'Buğday'
  category    VARCHAR(100) NOT NULL,         -- 'Hububat', 'Hayvancılık', …
  unit        VARCHAR(50) NOT NULL,          -- '₺/kg', '₺/kg CA'
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 4.6 `price_entries`  ← core table for market data

```sql
CREATE TABLE price_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES commodity_products(id),
  entry_date    DATE NOT NULL,              -- which trading day
  avg_price     NUMERIC(12, 4) NOT NULL,
  low_price     NUMERIC(12, 4) NOT NULL,
  high_price    NUMERIC(12, 4) NOT NULL,
  change_pct    NUMERIC(7, 4),             -- % change vs previous session
  volume        NUMERIC(14, 4),            -- traded volume (unit-agnostic)
  volume_unit   VARCHAR(50),               -- 'ton', 'baş', …
  session_time  TIME,                      -- e.g. 16:42
  created_by    UUID NOT NULL REFERENCES admins(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, entry_date)           -- one record per product per day
);

CREATE INDEX idx_price_entries_product_date ON price_entries(product_id, entry_date DESC);
CREATE INDEX idx_price_entries_date         ON price_entries(entry_date DESC);
```

**Price series for sparklines:** The last 10 entries per product are fetched via a window function and returned in a single API call. No separate `series` table needed.

---

### 4.7 `currency_rates`

```sql
CREATE TABLE currency_rates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         VARCHAR(20) NOT NULL,   -- 'USD/TRY', 'BIST 100', …
  label        VARCHAR(100),
  rate_value   NUMERIC(18, 6) NOT NULL,
  change_pct   NUMERIC(7, 4),
  direction    SMALLINT,               -- 1 = up, -1 = down, 0 = flat
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES admins(id)
);

CREATE INDEX idx_currency_rates_code_time ON currency_rates(code, recorded_at DESC);
```

> **Note:** Currency rates are typically pulled from a third-party data provider (e.g., TCMB / exchange rate APIs) and can be auto-ingested by a cron job. The `created_by` column is nullable to support automated ingestion.

---

### 4.8 `events` (Etkinlikler)

```sql
CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(255) UNIQUE NOT NULL,
  title        VARCHAR(500) NOT NULL,
  description  TEXT,
  location     VARCHAR(500),
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ,
  cover_image  UUID REFERENCES media(id),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by   UUID NOT NULL REFERENCES admins(id),
  updated_by   UUID REFERENCES admins(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_events_starts_at ON events(starts_at) WHERE deleted_at IS NULL;
```

---

### 4.9 `reports` (Raporlar)

```sql
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(500) NOT NULL,
  summary      TEXT,
  type         VARCHAR(50) NOT NULL,   -- 'Günlük' | 'Haftalık' | 'Aylık' | 'Sektör' | 'Ürün'
  period_label VARCHAR(100),           -- e.g., 'Nisan 2026', 'Hafta 19'
  file_id      UUID REFERENCES media(id) NOT NULL,
  report_date  DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by   UUID NOT NULL REFERENCES admins(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_reports_date ON reports(report_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_type ON reports(type)             WHERE deleted_at IS NULL;
```

---

### 4.10 `projects` (Projeler)

```sql
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(255) UNIQUE NOT NULL,
  title        VARCHAR(500) NOT NULL,
  description  TEXT,
  status       VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'planned'
  cover_image  UUID REFERENCES media(id),
  started_at   DATE,
  completed_at DATE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by   UUID NOT NULL REFERENCES admins(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);
```

---

### 4.11 `services` (Hizmetler)

```sql
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(100) UNIQUE NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon        VARCHAR(100),              -- icon key for frontend mapping
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 4.12 `geographical_indications` (Coğrafi İşaretler)

```sql
CREATE TABLE geographical_indications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(500) NOT NULL,
  category        VARCHAR(100) NOT NULL,
  type            VARCHAR(100) NOT NULL,   -- 'Tescilli Ürün' | 'Mahreç İşareti' | 'Menşe Adı'
  registration_no VARCHAR(100),
  registered_at   DATE,
  district        VARCHAR(100),
  is_highlight    BOOLEAN NOT NULL DEFAULT false,
  story           TEXT,
  cover_image     UUID REFERENCES media(id),
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_geo_ind_category ON geographical_indications(category) WHERE is_active = true;
```

---

### 4.13 `leadership`

```sql
CREATE TABLE leadership (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key     VARCHAR(100) UNIQUE NOT NULL,  -- 'president', 'vice_president', …
  name         VARCHAR(255) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  eyebrow      VARCHAR(255),
  quote_lines  TEXT[],                        -- array of paragraphs
  portrait_id  UUID REFERENCES media(id),
  sort_order   SMALLINT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 4.14 `media`

```sql
CREATE TABLE media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  size_bytes    BIGINT NOT NULL,
  storage_key   TEXT NOT NULL UNIQUE,    -- R2 object key: 'media/2026/05/uuid.webp'
  public_url    TEXT NOT NULL,
  width         INTEGER,                 -- images only
  height        INTEGER,                 -- images only
  alt_text      VARCHAR(500),
  uploaded_by   UUID NOT NULL REFERENCES admins(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 4.15 `audit_log`

```sql
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,       -- high-volume; serial int not UUID
  admin_id    UUID REFERENCES admins(id),
  action      VARCHAR(100) NOT NULL,       -- 'news.create', 'price.update', …
  entity_type VARCHAR(100),
  entity_id   UUID,
  diff        JSONB,                       -- {before: {...}, after: {...}}
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_admin     ON audit_log(admin_id, created_at DESC);
CREATE INDEX idx_audit_log_entity    ON audit_log(entity_type, entity_id, created_at DESC);
-- Partition by month for long-term performance (add when > 1M rows)
```

---

### 4.16 `stats_snapshot`  ← replaces hardcoded QuickStats

```sql
CREATE TABLE stats_snapshot (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       VARCHAR(255) NOT NULL,
  value       NUMERIC(18, 4) NOT NULL,
  suffix      VARCHAR(50),
  note        VARCHAR(255),
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 5. API Design

**Base URL:** `https://api.erzurumticaretborsasi.org.tr/api/v1`  
**Format:** JSON, UTF-8  
**Versioning:** URL path (`/v1/`) — simple, cacheable, explicit  
**Auth:** Bearer JWT for all `/admin/*` routes; public routes are unauthenticated

### 5.1 Standard response envelope

```json
// Success list
{
  "data": [...],
  "meta": { "total": 120, "limit": 20, "offset": 0 }
}

// Success single
{ "data": { ... } }

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Geçersiz giriş verisi",
    "details": [{ "field": "title", "message": "Başlık zorunludur" }]
  }
}
```

---

### 5.2 Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/news` | List published news (paginated, filterable by category) |
| GET | `/news/:slug` | Single news article |
| GET | `/news/search?q=` | Full-text search (Turkish FTS) |
| GET | `/announcements` | List active announcements |
| GET | `/announcements/ticker` | Ticker-only announcements (is_ticker=true, sorted by priority) |
| GET | `/announcements/:slug` | Single announcement |
| GET | `/prices/current` | Latest price entry per product (cached 5 min) |
| GET | `/prices/history/:productSlug` | Historical entries for sparklines |
| GET | `/prices/bulletin` | Full price bulletin view (all products, latest session) |
| GET | `/currency-rates` | Latest currency rates (cached 5 min) |
| GET | `/events` | Upcoming events (starts_at >= now) |
| GET | `/events/:slug` | Single event |
| GET | `/reports` | Published reports (paginated, filterable by type) |
| GET | `/reports/:slug` | Report metadata + file URL |
| GET | `/projects` | Published projects |
| GET | `/services` | Active services list |
| GET | `/geo-indications` | All active GIs (filterable by category) |
| GET | `/geo-indications/:slug` | Single GI detail |
| GET | `/leadership` | Active board members |
| GET | `/stats` | Latest stats snapshot |

**Query parameters (list endpoints):**
- `limit` (default 20, max 100)
- `offset` (default 0)
- `q` — full-text search where supported
- `category` — filter by category
- `type` — filter by type (reports)

---

### 5.3 Admin Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/auth/login` | Email + password → JWT + set refresh cookie |
| POST | `/admin/auth/refresh` | Use cookie → new JWT |
| POST | `/admin/auth/logout` | Revoke refresh token, clear cookie |
| GET | `/admin/auth/me` | Current admin profile |
| PATCH | `/admin/auth/me/password` | Change own password |

---

### 5.4 Admin Content Endpoints (pattern repeated per module)

Each content module follows the same CRUD pattern. Example for **news**:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/news` | editor+ | List all (incl. drafts, soft-deleted) |
| POST | `/admin/news` | editor+ | Create draft |
| GET | `/admin/news/:id` | editor+ | Get single |
| PATCH | `/admin/news/:id` | editor+ | Update fields |
| POST | `/admin/news/:id/publish` | editor+ | Set published_at = now() |
| POST | `/admin/news/:id/unpublish` | editor+ | Set published_at = NULL |
| DELETE | `/admin/news/:id` | editor+ | Soft delete |
| DELETE | `/admin/news/:id/permanent` | super_admin | Hard delete |

Same pattern applies to: `announcements`, `events`, `reports`, `projects`, `geo-indications`, `leadership`, `services`, `stats`

---

### 5.5 Admin Price Management Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/products` | List all commodity products |
| POST | `/admin/products` | Create new product |
| PATCH | `/admin/products/:id` | Edit product (name, unit, sort order) |
| GET | `/admin/prices` | Price entries (filter by product, date range) |
| POST | `/admin/prices` | Add price entry for a product + date |
| PATCH | `/admin/prices/:id` | Correct a price entry |
| DELETE | `/admin/prices/:id` | Remove price entry |
| POST | `/admin/prices/bulk` | Bulk import via JSON (paste from bulletin sheet) |
| GET | `/admin/currency-rates` | List rate history |
| POST | `/admin/currency-rates` | Add rate snapshot |

---

### 5.6 Admin Media Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/media/upload` | Multipart upload → store to R2, return media record |
| GET | `/admin/media` | List uploaded files (paginated, filterable) |
| PATCH | `/admin/media/:id` | Update alt text |
| DELETE | `/admin/media/:id` | Delete from R2 + DB |

---

### 5.7 Admin User Management (super_admin only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | List admins |
| POST | `/admin/users` | Create admin |
| PATCH | `/admin/users/:id` | Update role / deactivate |
| DELETE | `/admin/users/:id` | Remove admin |
| GET | `/admin/audit-log` | Paginated audit log |

---

## 6. Authentication & Security

### 6.1 JWT Strategy

```
Access Token:
  - Algorithm: HS256 (or RS256 if multiple services emerge later)
  - TTL: 15 minutes
  - Payload: { sub: adminId, role: 'editor', iat, exp }
  - Stored: in-memory in the admin SPA (never localStorage)

Refresh Token:
  - A cryptographically random 64-byte token (crypto.randomBytes)
  - Stored in DB as SHA-256 hash (never raw)
  - TTL: 7 days
  - Sent as HttpOnly; Secure; SameSite=Strict cookie
  - Rotated on each use (refresh token rotation)
```

### 6.2 Password Security

- **bcrypt** with 12 salt rounds (≈ 250 ms per hash — acceptable for login, meaningful protection)
- Minimum 12 characters, require complexity in admin panel UI
- Failed login attempts: lock account for 15 minutes after 5 failures (Redis counter)
- Send no information about whether an email exists (generic error message)

### 6.3 Input Validation

Every endpoint has a **Fastify JSON schema** declaration (request body, querystring, params). Invalid requests return 400 before business logic runs. Zod schemas serve as the single source of truth and are also shared with the admin SPA via a `@etb/schemas` shared package.

### 6.4 Rate Limiting (Fastify rate-limit + Redis)

| Endpoint group | Limit |
|---|---|
| `POST /admin/auth/login` | 10 req / 15 min per IP |
| All other admin routes | 300 req / min per admin |
| Public API | 120 req / min per IP |
| `POST /admin/media/upload` | 30 uploads / hour per admin |

### 6.5 CORS

```typescript
// Only the two known frontends are whitelisted
const allowedOrigins = [
  'https://erzurumticaretborsasi.org.tr',
  'https://admin.erzurumticaretborsasi.org.tr',
];
// In development: also allow localhost:5173, localhost:5174
```

### 6.6 Security Headers (via Helmet)

`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security` (max-age 1 year, includeSubDomains).

### 6.7 SQL Injection

Drizzle ORM uses parameterized queries by default. Raw SQL is used only in specific places (FTS triggers) and reviewed carefully. No string concatenation into queries.

---

## 7. Caching Strategy

```
Layer 1 — Nginx (static assets)
  ├── Public SPA bundle:    Cache-Control: max-age=31536000, immutable
  └── Admin SPA:            Cache-Control: no-store (sensitive)

Layer 2 — Fastify route-level (Redis, managed by cache.ts helper)
  ├── /prices/current       TTL: 5 min  (key: prices:current)
  ├── /currency-rates       TTL: 5 min  (key: currency:latest)
  ├── /announcements/ticker TTL: 10 min (key: ticker:active)
  ├── /news?...             TTL: 15 min (key: news:<hash-of-query>)
  ├── /events               TTL: 15 min
  ├── /stats                TTL: 30 min
  └── /geo-indications      TTL: 60 min (rarely changes)

Layer 3 — PostgreSQL (connection pool, 10 connections default)
```

**Cache invalidation:** When an admin publishes, updates, or deletes content, the corresponding Redis key is deleted (`DEL prices:current` etc.) immediately. No TTL dependency for correctness — TTL is a safety net only.

**Pattern:**
```typescript
async function getCached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as T;
  const data = await loader();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}
```

---

## 8. File Storage (Cloudflare R2)

**Why R2:** Zero egress fees vs. AWS S3's $0.09/GB egress; S3-compatible API (same `@aws-sdk/client-s3`); GDPR-friendly EU zone available.

### Upload flow

1. Admin selects file in admin panel
2. POST `/admin/media/upload` (multipart, max 50 MB)
3. Fastify:
   - Validates mime type (allowlist: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`)
   - For images: convert to WebP using `sharp`, resize to max 2000px wide
   - Generate `storage_key`: `media/YYYY/MM/<uuid>.<ext>`
   - Upload to R2 via AWS SDK
   - Insert row in `media` table
   - Return `{ id, publicUrl, width, height }`
4. Admin uses returned `id` as `cover_image` FK when saving news/event/etc.

### R2 Bucket Configuration

- **Public bucket** for images (served via `cdn.erzurumticaretborsasi.org.tr`)
- **Private bucket** for report PDFs (signed URLs with 1-hour TTL, generated at request time)

---

## 9. Admin Panel Design

**Stack:** React 18 + TypeScript + Vite (separate app, `admin-panel/`)  
**UI library:** shadcn/ui + Tailwind CSS (purpose-built for admin UIs)  
**State management:** TanStack Query v5 (server state) + Zustand (UI state)  
**Forms:** React Hook Form + Zod (shared schemas from backend)  
**Rich text:** Tiptap (headless editor, full HTML output, Turkish language pack)  
**Tables:** TanStack Table v8 (sortable, filterable, paginated)  
**Routing:** React Router v6

### Admin Panel Pages

```
/login
/dashboard             ← overview: today's price summary, recent news, pending drafts
/news                  ← list with search, filter, status badges
/news/new              ← Tiptap editor, cover image picker, category/tone selects
/news/:id/edit
/announcements
/announcements/new
/prices                ← date-range picker, product filter; inline editable table
/prices/bulletin       ← preview the public price bulletin
/events
/events/new
/reports
/reports/new           ← upload PDF, fill metadata
/projects
/geo-indications
/services
/leadership
/media                 ← media library, drag-and-drop upload
/settings
/settings/admins       ← (super_admin only)
/settings/audit-log    ← activity log
```

### Price Entry UX

The prices page is the most operationally critical. The UX should mimic a spreadsheet: a grid with products as rows and the current session's columns (avg, low, high, volume). The admin pastes from their daily bulletin sheet or fills inline. On save, the API does an upsert (`INSERT … ON CONFLICT (product_id, entry_date) DO UPDATE`).

---

## 10. Frontend Integration (Migrating from Static Data)

The current React frontend reads from `src/data/*.ts`. The migration is done module by module, with no big-bang rewrite:

### Migration Sequence (recommended)

1. **Prices + currency rates** — highest value, changes daily → migrate first
2. **Announcements (ticker)** — changes frequently
3. **News (haberler)** — migrate + add rich body from Tiptap
4. **Events** — straightforward
5. **Reports** — add PDF links
6. **Geographical Indications** — rarely changes; migrate last
7. **Leadership / Stats** — lowest frequency

### API Client in Frontend

```typescript
// src/lib/api.ts
const BASE = import.meta.env.VITE_API_URL; // https://api.erzurumticaretborsasi.org.tr/api/v1

export async function fetchCurrentPrices() {
  const res = await fetch(`${BASE}/prices/current`);
  if (!res.ok) throw new Error('Price fetch failed');
  return res.json();
}
```

Use **TanStack Query** in the frontend (add `@tanstack/react-query`) for caching, refetch intervals, and loading/error states. Price data can refetch every 5 minutes in-browser:

```tsx
const { data } = useQuery({
  queryKey: ['prices', 'current'],
  queryFn: fetchCurrentPrices,
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
});
```

---

## 11. Deployment

### Docker Setup

```dockerfile
# backend/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: ./backend
    environment:
      DATABASE_URL: postgres://etb:${DB_PASSWORD}@db:5432/etb
      REDIS_URL: redis://cache:6379
      JWT_SECRET: ${JWT_SECRET}
      R2_ACCOUNT_ID: ${R2_ACCOUNT_ID}
      R2_ACCESS_KEY: ${R2_ACCESS_KEY}
      R2_SECRET_KEY: ${R2_SECRET_KEY}
    depends_on: [db, cache]
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: etb
      POSTGRES_USER: etb
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

  cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./public-dist:/usr/share/nginx/html/public:ro
      - ./admin-dist:/usr/share/nginx/html/admin:ro
    ports: ["80:80", "443:443"]
    depends_on: [api]
    restart: unless-stopped

volumes:
  pgdata:
```

### Hosting Options (ranked by fit)

1. **Railway** — simplest managed Postgres + Redis + Docker deployments; reasonable cost for institutional use
2. **DigitalOcean App Platform** — managed DB + Redis add-ons; good GDPR posture
3. **Self-hosted VPS (Hetzner EU)** — full control, very cost-effective, requires more ops knowledge

### Backup Policy

- PostgreSQL: `pg_dump` daily to R2 (retained 30 days), WAL archiving for point-in-time recovery
- Redis: RDB snapshot every 5 minutes + AOF persistence
- R2 (files): Cloudflare versioning enabled

---

## 12. CI/CD Pipeline

```
Push to feature branch
    → GitHub Actions:
        ├── tsc --noEmit (type check)
        ├── eslint
        ├── jest (unit tests)
        └── Build Docker image

Merge to main
    → GitHub Actions:
        ├── All above checks
        ├── Integration tests (Postgres + Redis in CI via docker-compose)
        ├── Build + push image to registry
        └── Deploy to staging (auto)
            └── (manual gate) → Deploy to production
```

---

## 13. Observability

### Logging

Structured JSON logs via **Pino** (Fastify's built-in logger):
```json
{ "level": "info", "time": "2026-05-15T14:32:10Z", "reqId": "abc123",
  "method": "POST", "url": "/api/v1/admin/news", "statusCode": 201,
  "responseTime": 42, "adminId": "uuid..." }
```

Log levels: `error` for 5xx, `warn` for 4xx (except 404), `info` for all mutations.

### Metrics

Expose `GET /metrics` in Prometheus format via `fastify-metrics`. Track:
- Request rate, error rate, latency (p50/p95/p99) per route
- Cache hit ratio (Redis)
- DB query time
- Active connections

### Health Checks

```
GET /healthz         → { status: 'ok' }  (liveness — just the process)
GET /readyz          → checks DB + Redis connectivity (readiness)
```

---

## 14. Environment Variables (`.env.example`)

```bash
# App
NODE_ENV=production
PORT=3001
BASE_URL=https://api.erzurumticaretborsasi.org.tr

# Database
DATABASE_URL=postgres://etb:password@localhost:5432/etb
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=<64-byte random hex>
JWT_ACCESS_TTL=900          # seconds (15 min)
JWT_REFRESH_TTL=604800      # seconds (7 days)

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PUBLIC=etb-media
R2_BUCKET_PRIVATE=etb-reports
R2_PUBLIC_URL=https://cdn.erzurumticaretborsasi.org.tr

# CORS
ALLOWED_ORIGINS=https://erzurumticaretborsasi.org.tr,https://admin.erzurumticaretborsasi.org.tr

# (optional) Gemini — move existing recipe chat to backend proxy
GEMINI_API_KEY=
```

---

## 15. Implementation Roadmap

### Phase 1 — Foundation (Weeks 1–2)

- [ ] Set up Fastify project, TypeScript, Drizzle, linting
- [ ] PostgreSQL schema + migrations (all tables)
- [ ] Auth system: login, JWT, refresh token rotation, password hashing
- [ ] Admin panel skeleton: login page, routing, JWT memory store, interceptors

### Phase 2 — Core Content Management (Weeks 3–4)

- [ ] News CRUD + publish/unpublish + Tiptap editor in admin
- [ ] Announcements CRUD + ticker flag
- [ ] Media upload → R2 + media library UI

### Phase 3 — Market Data (Week 5)

- [ ] Commodity products + price entries API
- [ ] Admin price entry UI (spreadsheet-like grid)
- [ ] Currency rates endpoint
- [ ] Redis caching for prices + cache invalidation on save

### Phase 4 — Remaining Modules (Week 6)

- [ ] Events, Reports (PDF upload), Projects, Services, GIs, Leadership, Stats

### Phase 5 — Frontend Integration (Weeks 7–8)

- [ ] Add TanStack Query to public frontend
- [ ] Replace each `src/data/*.ts` with API calls, module by module
- [ ] Remove static data files once all endpoints are verified

### Phase 6 — Hardening (Week 9)

- [ ] Rate limiting, audit log, security headers
- [ ] Structured logging, health checks, Prometheus metrics
- [ ] Load testing (k6): verify p95 latency < 200 ms at 50 concurrent users
- [ ] Penetration testing checklist (OWASP Top 10)

### Phase 7 — Production (Week 10)

- [ ] Docker Compose production config, Nginx TLS config
- [ ] Backup scripts for PostgreSQL + verify restore
- [ ] Admin training session + Turkish-language admin UI copy review
- [ ] Go live + monitor

---

## 16. Key Trade-offs Documented

| Decision | Alternative Considered | Why This Choice Won |
|---|---|---|
| Fastify | Express | 3× throughput; TypeScript-native; built-in schema validation |
| Drizzle ORM | Prisma | Lighter runtime (no query engine binary); better SQL control; Prisma is fine too |
| Custom admin | Strapi / Payload CMS | Full schema control; no CMS upgrade lock-in; smaller runtime footprint |
| PostgreSQL full-text search (Turkish) | Elasticsearch | Avoid extra infrastructure; Postgres Turkish dictionary (`pg_catalog.turkish`) is sufficient for this scale |
| R2 | AWS S3 | Zero egress fees; same SDK; better economics for a regional institution |
| Monolith | Microservices | Team size and domain don't justify microservices complexity; can extract later if needed |
| UUID PKs | Serial INT | Safer for future data portability and external integrations; negligible performance difference at this scale |
| Soft deletes | Hard deletes | Regulatory requirement for institutions to retain data; easier mistake recovery |
```

---

*Document version: 1.0 — May 2026*  
*Review this plan before Phase 5 to assess if any scope has changed.*
