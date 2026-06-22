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
| `/properties/[id]`  | Property Detail  | Underwrite, comparables, notes                      |
| `/saved`            | Saved Deals      | Tracked deals sorted by flip score                  |
| `/settings`         | Settings         | Data-source/API status + scoring assumptions        |

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
cd sioux-falls-flip-radar
npm install
cp .env.example .env        # fill in your keys
npm run prisma:generate
npm run db:push             # push schema to Supabase (needs DATABASE_URL)
npm run dev
```

The Supabase SQL (tables, RLS policies, triggers, seed data) lives in
[`supabase/schema.sql`](./supabase/schema.sql) — run it in the Supabase SQL
editor. The equivalent Prisma schema is in
[`prisma/schema.prisma`](./prisma/schema.prisma).

The app renders with **sample data** out of the box so you can click through
every page before connecting a database.

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
