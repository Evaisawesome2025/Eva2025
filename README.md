# Flowline

**An AI marketing manager for local service businesses.** A small business owner
signs up, tells Flowline about their business, connects their Google Ads, Meta,
website, and lead sources, and gets one agent they can just talk to — measured in
booked jobs and dollars, not clicks.

Built first for **FreshFlow Dryer Vent Cleaning**, designed so any small business
can create an account and use it.

## What it does

- **Onboarding wizard** — business name, website, the phone number you'll text to
  chat with your agent, the services you provide, your service area, and your unit
  economics (average job value, close rate, target cost per booked job).
- **Connect your accounts** — Google Ads + Local Services, Meta, your website, call
  tracking, and Google Business Profile. Read-only to start.
- **Builds your website** — no site? Flowline generates and hosts a professional
  landing page from your services and service area, live at `/site/<id>`.
- **Live dashboard** — the real funnel (spend → leads → bookings → revenue) per
  channel, cost per booked job vs. target, a leads inbox with speed-to-lead alerts,
  drafted review replies, and a prioritized weekly action list.
- **Chat with your agent** — ask about performance, leads you missed, wasted spend,
  budget, reviews, or your website. It answers from your real numbers.
- **Two gates always on** — nothing that affects **spend** and nothing
  **customer-facing** goes live without the owner's explicit approval. The agent
  drafts; you approve.

## How small-business owners benefit

- One place instead of five dashboards and an agency retainer.
- Decisions framed the way an owner thinks: cost per booked job vs. profit per job.
- Catches the most expensive problem in the trades — leads that never got called back.
- Gets a real website in seconds if they don't have one, kept in sync with what converts.
- Stays in control: the agent earns trust on read-only work before it touches spend.

## Architecture

Next.js (App Router).

| Path | Purpose |
| --- | --- |
| `app/page.js` | Marketing landing page |
| `app/onboarding/page.js` | Multi-step signup wizard |
| `app/dashboard/page.js` | Owner dashboard + agent chat |
| `app/site/[id]/page.js` | The live, hosted website generated for each business |
| `app/api/account/route.js` | Create / fetch / update accounts |
| `app/api/agent/route.js` | Funnel insights + chat replies |
| `lib/store.js` | Account store (file-backed, in-memory fallback) |
| `lib/insights.js` | Builds the funnel/leads/approvals from a business profile |
| `lib/agent.js` | The agent's replies (rule-based; uses Claude when `ANTHROPIC_API_KEY` is set) |
| `lib/website.js` | Generates the hosted-website content from a profile |

The `business-agent/` directory holds the matching Claude Code agent definition
(skills, operating rules, spend/reputation gates) that this product is the front
end for.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

### Configuration

- `ANTHROPIC_API_KEY` — optional. When set, the chat agent calls Claude grounded in
  the business profile + live funnel under the spend/reputation rules. Without it,
  the agent uses a deterministic responder that reads the same data.
- `DATA_DIR` — where the account store writes (defaults to `.data/`). On read-only
  hosts it falls back to in-memory.

## What's real vs. demo

Real: onboarding, account persistence, the dashboard, the chat agent, and the
generated/hosted business websites. The ad-platform connections use placeholder
OAuth and the funnel numbers are synthesized per account so the dashboard is
populated — swap `lib/insights.js` for live Google Ads / Meta / GA4 / call-tracking
pulls and the UI is unchanged.
