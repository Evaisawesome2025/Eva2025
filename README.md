# Sioux Falls Flip Radar

A private real estate investing dashboard for analyzing house flips in the
Sioux Falls, SD market. Enter an address, plug in your numbers, and get an
instant **max offer**, **estimated profit**, and a **0–100 flip score** with a
green / yellow / red verdict — built for fast decisions on mobile or desktop.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **Supabase** (Postgres + Auth + RLS)
- **Prisma** ORM
- **Google Places** address autocomplete

## Pages

| Route               | Page             | What it does                                        |
| ------------------- | ---------------- | --------------------------------------------------- |
| `/`                 | Dashboard        | Pipeline stats + recent analyses                    |
| `/analyze`          | Analyze Property | Address search + deal inputs + live score           |
| `/properties/[id]`  | Property Detail  | Underwrite, status, comparables, notes              |
| `/rental`           | Rental Analysis  | BRRRR / buy-and-hold: cap rate, cash flow, CoC, DSCR |
| `/compare`          | Compare Deals    | Side-by-side comparison with best-value highlighting |
| `/saved`            | Saved Deals      | Tracked deals sorted by flip score                  |
| `/settings`         | Settings         | Data-source/API status + scoring assumptions        |
| `/login`            | Login            | Email/password auth (when Supabase is configured)   |

## Power tools

- **Repair Estimator** — line-item rehab budget (roof, kitchen, HVAC, …) with a
  contingency buffer that drops straight into the repairs field.
- **Financing Calculator** — hard-money loan terms → monthly carry + points,
  applied to the analysis in one click.
- **Sensitivity Analysis** — a live grid showing how profit and the verdict move
  as ARV and repairs flex ±, so you see the downside before you offer.
- **Rental / BRRRR engine** (`rentalAnalysisService`) — NOI, cap rate, cash flow,
  cash-on-cash, DSCR, and the 1% rule for buy-and-hold underwriting.
- **Deal comparison** — stack your top opportunities and highlight the best
  number in every row.
- **Dashboard charts** — verdict mix + pipeline-by-status, dependency-free.
- **Offer Scenarios** — max offer at conservative / standard / aggressive ARV
  multipliers, flagged green/red against your purchase price.
- **Customizable scoring** — tune the ARV rule, ROI/margin targets, and verdict
  thresholds in Settings; saved to your browser and synced to Supabase when
  signed in. The Analyze page scores live against your assumptions.
- **Printable deal sheet** — a clean one-page PDF (`/properties/[id]/print`)
  with the headline numbers, underwrite, and notes.
- **5-year wealth projection** (rentals) — appreciation + loan paydown +
  compounding cash flow into equity and total return, with tunable
  appreciation / rent-growth.
- **CSV / JSON export** — download your whole pipeline (`/api/export`).
- **Dark mode** — system-aware, persisted, no flash.
- **Pipeline map** (`/map`) — every deal plotted and color-coded by verdict
  (Google Maps; degrades to a location list without a key).
- **Command palette** — ⌘K / Ctrl+K to jump to any page or deal instantly.
- **BRRRR refinance** — new-loan, cash-out, and capital-left-in math with
  infinite-return detection, right on the Rental page.
- **Rehab presets** — Cosmetic / Moderate / Gut one-click line-item budgets.
- **Portfolio analytics** (`/portfolio`) — pipeline profit, capital required,
  by-county breakdown, verdict mix, and your best deal.
- **Loading skeletons** — instant skeleton states on data-backed pages.

## Authentication

The app is gated by **Supabase Auth**. `middleware.ts` refreshes the session on
every request and redirects unauthenticated users to `/login`. Row Level
Security in the database ensures each user only ever sees their own rows.

**Demo mode:** when the Supabase env vars are absent, the auth gate is bypassed
and every page renders bundled **sample data** — so the deployed URL is useful
immediately and becomes fully private + live the moment you add credentials.

## API routes

| Route                        | Method        | Purpose                                  |
| ---------------------------- | ------------- | ---------------------------------------- |
| `/api/analyze`               | POST          | Persist a property + analysis + saved deal (recomputed server-side) |
| `/api/saved-deals/[id]`      | PATCH, DELETE | Update pipeline status / stop tracking   |
| `/api/notes`                 | POST          | Add a note to a property                 |
| `/api/comps`                 | POST          | Fetch + store comps from an approved provider |
| `/api/geocode`               | GET           | Resolve a place_id/address (county, lat/lng) |
| `/auth/callback`, `/auth/signout` | GET / POST | Auth session exchange + sign out      |

Every write route authenticates the Supabase user and enforces ownership.

## Deal math (`src/services/dealScoringService.ts`)

- **Max offer** = `ARV × 0.70 − repairs` (the 70% rule)
- **Estimated profit** = `ARV − purchase − repairs − holding − selling − closing`
  - holding = `financingCost (monthly) × holdingMonths`
  - selling = `ARV × sellingCostPct / 100`
- **Flip score (0–100)** blends cash-on-cash ROI (45%), profit-to-ARV margin
  (35%), and purchase cushion vs. the max offer (20%)
- **Verdict**: score ≥ 70 green · ≥ 45 yellow · else red

## Getting started

```bash
npm install
cp .env.example .env        # fill in your keys
npm run prisma:generate
npm run db:push             # push schema to Supabase (needs DATABASE_URL)
npm run db:seed             # seed the approved data-source registry
npm run dev
```

The Supabase SQL (tables, RLS policies, triggers, seed data) lives in
[`supabase/schema.sql`](./supabase/schema.sql) — run it in the Supabase SQL
editor. The equivalent Prisma schema is in
[`prisma/schema.prisma`](./prisma/schema.prisma).

The app renders with **sample data** out of the box so you can click through
every page before connecting a database.

## Testing

```bash
npm test          # run the vitest suite once
npm run test:watch
```

Unit tests cover the flip math (`dealScoringService`) and formatting helpers.

## Data layer & compliance

The data layer is built to plug in **approved** providers only. Placeholder
service wrappers (env-var driven) are ready in `src/services/`:

- `googleGeocodingService` — Places/Geocoding (county, lat/lng)
- `rentcastService` — RentCast AVM + comps
- `attomService` — ATTOM property/sales records
- `countyDataService` — Minnehaha/Lincoln County GIS open data
- `dealScoringService` — the flip math (live, no key needed)

> This app does **not** scrape Zillow, Realtor.com, Redfin, Facebook
> Marketplace, or any site that disallows automated access. Add only
> ToS-compliant APIs and licensed MLS/IDX feeds.

All API keys are read from environment variables — see `.env.example`.
