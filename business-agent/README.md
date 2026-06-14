# FreshFlow Dryer Vent Cleaning — Business Agent

One Claude Code agent you talk to about the whole business. It reads and (with your approval)
manages Google Ads + Local Services Ads, Meta Ads, the website/booking funnel, your Google Business
Profile & reviews, analytics + call tracking, and lead follow-up.

This is built for a **local lead-gen trade business**: the goal is booked jobs at a profitable cost
per booking — not online sales. The agent thinks in leads, bookings, and dollars.

## What it does
- Pulls performance across every surface and builds the real funnel: spend → leads → bookings → revenue.
- Tells you the cost per booked job per channel vs your targets.
- Finds wasted ad spend, fatigued creative, slipping rankings, and **leads that never got called back**.
- Drafts ad/page/review changes; nothing that spends money or faces a customer goes live without you.

## 1. Install Claude Code
```
npm install -g @anthropic-ai/claude-code
```

## 2. Get API access for each surface
- **Google Ads + LSA:** developer token (Google Ads API Center) + OAuth2 client + refresh token +
  login customer ID. Local Services Ads reporting for pay-per-lead data + disputes.
- **Meta Ads:** Meta app (developers.facebook.com) → Marketing API → long-lived token + ad account ID.
- **GA4:** service account with Viewer on the property + property ID. Enable the Analytics Data API.
- **Search Console:** add the service account / OAuth as a user on the verified property.
- **Call tracking:** API key from your provider (CallRail / WhatConverts / etc.) — this is the
  source of truth for phone leads.
- **Google Business Profile:** Business Profile API access (OAuth) + location ID.
- **Website:** WordPress application password, OR a git repo path with a deploy hook.

## 3. Fill in config
- Put secrets in `config/credentials.env` (never commit — already gitignored).
- Edit `config/targets.yaml`: your service area, average job value, close rate, cost-per-lead /
  cost-per-booking targets, account IDs, and seasonality. **The economics section drives every
  spend recommendation — fill it in honestly.**

## 4. Connect the tools
Two ways to give the agent hands on each platform:
- **MCP servers** (cleaner): add Google Ads / Meta / GA4 / call-tracking MCP servers to your Claude
  Code config so the agent calls them as tools.
- **Scripts:** put small Python API wrappers in `scripts/` (one per platform) and let the agent run them.
Start with whichever exists for your stack; MCP where available, scripts to fill gaps.

## 5. Talk to it
From the project folder:
```
cd business-agent
claude
```
Then just talk:
- "How did paid do last week — what did a booked job cost?"
- "Any leads we didn't call back?"
- "Why are bookings down even though clicks are up?"
- "Cut wasted Google spend and draft LSA disputes for the junk leads."
- "Draft replies to this week's reviews."

It reads CLAUDE.md, uses the right skill, and respects the spend + reputation gates.

## 6. (Optional) Schedule it
```
chmod +x scripts/daily_review.sh
crontab -e
# 0 7 * * * /full/path/business-agent/scripts/daily_review.sh
```
Each morning it runs the analysis, applies safe changes, and writes anything that spends money or
faces a customer to `logs/pending-approval-DATE.md` for you to approve.

## The rules that protect you
- **Spend gate:** nothing that affects spend executes without your explicit OK.
- **Reputation gate:** no review reply, GBP edit, or customer message goes out without your OK.
Keep both on (`require_approval_for_spend` / `require_approval_for_customer_facing`) until the agent
has earned trust on read-only work.

## Skills
- `skills/google-ads` — Search + Local Services Ads
- `skills/meta-ads` — Facebook/Instagram lead-gen
- `skills/website` — landing pages + booking funnel
- `skills/local-presence` — Google Business Profile, reviews, LSA profile
- `skills/analytics` — GA4 + Search Console + call tracking (the referee)
- `skills/lead-response` — speed-to-lead + missed-call recovery
