# Public frontend vs admin panel: data sync gap

This document explains **why changes made in the admin panel do not appear on the public website today**, and **what work is required** so the frontend reflects database-backed content after each edit.

---

## 1. Problem statement

### What works today

1. **Admin panel** (`admin-panel/`) mutates content through authenticated Fastify routes under `/api/v1/admin/...` (news, announcements, prices, projects, geo indications, etc.).
2. **Backend** persists that data in PostgreSQL (and uses Redis for caching where implemented).
3. **Public read API** is already implemented: unauthenticated `GET` handlers under **`/api/v1/...`** (same `server.ts` registrations, prefix `/api/v1`).

So the **pipeline from admin UI → API → database → public API** is largely in place on the server side.

### What does not work today

The **public Vite/React app** (`src/` at repository root, main site) **does not consume those public APIs** for CMS-style content. Instead it reads **compile-time static modules**:

- `src/data/market.ts` — news, announcements, products/prices snapshot, currencies, services, reports, stats (and related types)
- `src/data/geographical-indications.ts` — coğrafi işaretler list/category model
- `src/data/plannedEvents.ts` — etkinlik previews
- `src/data/leadership.ts` — yönetim / president band content
- **`src/components/ProjectsShowcase.tsx`** — projeler: large **in-component hardcoded** arrays (`ongoingProjects`, `completedProjects`, etc.), not even a shared `src/data` file

Therefore, **any publish/edit in the admin panel updates the DB and the public JSON API, but the brochure site keeps showing the old static copy** until developers change `src/data/*` or refactor the UI to fetch from the API.

**Exception (out of scope for “CMS”):** recipe / Gemini experiences (e.g. `kadayif-dolmasi-recipe`, `useRecipeChat`) intentionally use local data or third-party APIs—not the same pattern as news or announcements.

---

## 2. Evidence: static imports vs network

- Grep-style inventory: **no `fetch()` to `/api/v1` for news, duyurular, prices, etc.** in `src/` except unrelated cases (e.g. Gemini client).
- Representative imports:
  - `HomeSections`, `NewsEditorial`, `HomeHumanStoriesNews`, `AnnouncementTicker` → `../data/market`
  - `GeographicalIndicationsAtlas` → `../data/geographical-indications`
  - `EventsPreview` / `EventsShowcase` → `../data/plannedEvents`
  - `ReportCards`, `ServicesGrid`, `QuickStats`, price components → `../data/market`
  - `ProjectsShowcase` → **inline constants** inside the component file

---

## 3. Backend public endpoints (reference)

All of the following are registered with prefix **`/api/v1`** (see `backend/src/server.ts`). Paths below are **relative to** `https://<API_HOST>/api/v1`.

| Domain | Public HTTP routes (examples) | Notes |
|--------|--------------------------------|--------|
| Haberler | `GET /news`, `GET /news/search`, `GET /news/:slug` | Pagination/query in route modules |
| Duyurular | `GET /announcements/ticker`, `GET /announcements`, `GET /announcements/:slug` | Ticker for header strip |
| Fiyatlar | `GET /prices/current`, `GET /prices/bulletin`, `GET /prices/history/:productSlug` | Aligns with bulletin UX in `backendplan.md` |
| Döviz | `GET /currency-rates` | |
| Etkinlikler | `GET /events`, `GET /events/:slug` | |
| Raporlar | `GET /reports`, `GET /reports/:slug` | PDF/media via media layer as designed |
| Projeler | `GET /projects` | |
| Hizmetler | `GET /services` | |
| Coğrafi işaretler | `GET /geo-indications`, `GET /geo-indications/:slug` | |
| Yönetim | `GET /leadership` | |
| İstatistikler | `GET /stats` | |

**Response shape:** follow the existing JSON envelopes used in the codebase (typically `{ data, meta? }` and `{ error: { code, message, details? } }` on failure). Exact fields are defined by each route’s handler; the frontend work includes **mapping** API DTOs to current React prop shapes (or evolving those components).

---

## 4. Crosswalk: UI surface → today’s source → API to target

Use this during migration tickets.

| User-visible area | Representative pages / components | Current data source | Target public API |
|-------------------|-------------------------------------|---------------------|-------------------|
| Ana sayfa: haber / duyuru / özet blokları | `HomeSections.tsx`, `HomeHumanStoriesNews.tsx`, `AnnouncementTicker.tsx` | `market.ts` | `/news`, `/announcements`, `/announcements/ticker` |
| Haberler sayfası | `NewsPage.tsx`, `NewsEditorial.tsx` | `market.ts` `news` | `/news`, `/news/:slug` if detail routes added |
| Duyurular | `AnnouncementsPage.tsx` | `market.ts` `announcements` | `/announcements`, `/announcements/:slug` |
| Fiyat özeti / bulletin | `PriceBulletinPanel.tsx`, `MarketPriceOverview.tsx`, `LiveMarketStrip.tsx` | `market.ts` `products`, `currencies` | `/prices/current`, `/prices/bulletin`, `/currency-rates` |
| Etkinlik önizleme | `EventsPreview.tsx`, `EventsShowcase.tsx` | API | `/events?when=upcoming` / `when=all` |
| Rapor kartları | `ReportCards.tsx` | `market.ts` `reports` | `/reports` |
| Projeler vitrin | `ProjectsPage.tsx`, `ProjectsShowcase.tsx` | API (`usePublicProjects`) + statik fallback | `/projects` |
| Coğrafi işaretler | `GeographicalIndicationsAtlas.tsx`, routes under `/cografi-isaretler` | API (`usePublicGeo`) | `/geo-indications`; seed source file `geographical-indications.ts` (not runtime) |
| Hizmetler grid | `ServicesGrid.tsx` | `market.ts` `services` | `/services` |
| KPI / stats | `QuickStats.tsx` | `market.ts` stats slice | `/stats` |
| Yönetim bandı | `HomePresidentBand.tsx` | API + `leadership.ts` fallback | `/leadership` |

Special pages (e.g. **Kadayıf dolması** narrative + recipe tooling) may stay static or hybrid until product decides—they are not simple list/detail CMS surfaces.

---

## 5. What needs to be done (recommended approach)

High-level:** replace static imports with a small public API client + hooks, then migrate module by module** (same sequencing as `backendplan.md`: high-churn operational data first).

### 5.1 Foundation (all modules)

1. **Environment**
   - Add something like **`VITE_PUBLIC_API_URL`** (or `VITE_API_BASE_URL`) in the **root** frontend `.env.example`, pointing at the Fastify origin **without** trailing slash (e.g. `http://localhost:3001`).
   - Document production values per deploy target.

2. **CORS**
   - Ensure `ALLOWED_ORIGINS` on the backend includes the **public site dev origin** (e.g. `http://localhost:5173`) as well as the admin origin (`5174`). Public `GET` routes do not send auth cookies by default; CORS still applies for browser `fetch` from another origin.

3. **API client layer** (`src/lib/publicApi.ts` or similar)
   - `fetchJSON(path)` assembling ``${VITE_PUBLIC_API_URL}/api/v1${path}``.
   - Parse success envelopes and throw/handle **`error.code`** consistently.
   - Optional: timeouts, AbortController for route changes, and basic retry only where safe (mostly idempotent GETs).

4. **Server state**
   - Add **TanStack Query** (`useQuery`) in the root app for caching, stale times, deduplication, and loading/error UX. Mirrors what you already chose for `admin-panel/`.

5. **Loading / error / empty UX**
   - Every surface that currently assumes synchronous arrays needs skeletons, “veri yüklenemedi” states, and empty lists when API returns zero rows.

### 5.2 Per-domain migration steps

For **each** row in §4:

1. **Read** the public route handler and response types in `backend/src/modules/<domain>/...public.routes.ts` (and underlying services).
2. **Define** thin TypeScript types (or Zod parsers) for the JSON you actually need in the UI.
3. **Map** API DTO → existing component props (`NewsItem`-like shapes today live in `market.ts`; either adapt mappers or slim down types centrally).
4. **Replace** `import { … } from "../data/market"` with `useNewsList()` etc.
5. **Remove or archive** obsolete static fragments only after parity is verified.

**Projeler:** the largest mismatch is not “file vs API” but **design**: `ProjectsShowcase` encodes bespoke phases, icons, metrics. The API’s `/projects` list may not expose all of that. Decide either:

- **Simplify UI** to match API fields (recommended for sustainability), or  
- **Extend backend schema + admin forms** if those rich fields must remain editorial.

### 5.3 Media and rich content

News bodies and similar fields may return **HTML** (from Tiptap in admin). The public site already uses expressive layouts; ensure:

- **Sanitisation** policy (DOMPurify or server-side sanitisation contract) before `dangerouslySetInnerHTML`, if applicable.
- **Images:** public URLs likely come from R2/CDN via `media.publicUrl`; front-end should render `img src` from API, not static imports.

### 5.4 Caching and freshness

Backend uses Redis revision keys for several modules (e.g. news/announcements cache patterns in plan). Frontend should:

- Use **reasonable `staleTime`** (seconds–minutes for lists; shorter for ticker if needed).
- Optionally refetch on `window.focus` if you want “feels live” without polling.

### 5.5 SEO and detail pages

If you introduce **deep links** (e.g. `/haberler/:slug`, `/duyurular/:slug`), plan:

- **React Router** routes matching slugs from API  
- Optional **meta tags** later (SSR/SSG or prerender)—out of scope for first API wiring but affects “news detail” completeness.

---

## 6. Suggested rollout order

Aligned with operational value and dependency risk:

| Phase | Modules | Rationale |
|-------|---------|-----------|
| A | Announcements ticker + list, News list/home blocks | Frequently updated; drives trust |
| B | Prices current/bulletin + currency rates | Daily operational data |
| C | Events, Reports | Structured list/detail pattern |
| D | Projects, Services, Stats | Straightforward listings |
| E | Geo indications | Rich UI; mapper effort + optional slug pages |
| F | Leadership | Often low-frequency; simpler list |

Projeler (**ProjectsShowcase**) should be tackled with explicit **UX/schema agreement** early (§5.2).

---

## 7. Verification checklist

After each migrated module:

- [ ] Published content edited in admin appears on public route after refresh (and within stale window / cache expectation).
- [ ] Unpublished or deleted (per backend rules) content **disappears** from public endpoints and thus from UI.
- [ ] Backend down / 503 shows a graceful message, not a blank or thrown exception.
- [ ] Mobile layout unchanged or improved; no regressions on existing routes.
- [ ] Lighthouse / accessibility: loading states labelled; images have `alt` from API where provided.

---

## 8. Summary

| Layer | Status |
|-------|--------|
| Admin → DB | Working (via `/api/v1/admin/...`) |
| DB → Public API | Working (via `/api/v1/...`) |
| Public API → Root `src/` frontend | **Not wired** — static `src/data/*` and hardcoded projeto data |

**Closing:** The gap is exclusively on the **public React app wiring**. Implementing **`VITE_PUBLIC_API_URL`, a fetch/query layer, and incremental replacement of static imports** is the fix; no redesign of admin is strictly required unless you expand project fields.

---

## 9. File references

- Backend route registration: `backend/src/server.ts`
- Static market bundle: `src/data/market.ts`
- Geo static data: `src/data/geographical-indications.ts`
- Events static data: `src/data/plannedEvents.ts`
- Leadership static data: `src/data/leadership.ts`
- Hardcoded projeler UI: `src/components/ProjectsShowcase.tsx`
- Prior migration notes: `backendplan.md` (§10 Frontend integration)

---

*Document generated to align engineering on the CMS integration gap; update this file when modules migrate or API paths change.*
