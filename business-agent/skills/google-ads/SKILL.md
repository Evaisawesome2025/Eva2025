---
name: google-ads
description: Read and manage FreshFlow's Google Ads — Search campaigns AND Local Services Ads (LSA). Metrics, bids, budgets, keywords, negatives, LSA leads/disputes. Use for any Google Ads or LSA task.
---

# Google Ads (Search + Local Services Ads)

FreshFlow runs two Google products: **Search ads** (keyword auctions) and **Local Services Ads**
(LSA / "Google Guaranteed", pay-per-lead, shown above search). Both matter; LSA is often the
cheapest booked-job source for a local trade.

## Auth
Google Ads API. Requires: developer token, OAuth2 client ID/secret/refresh token, login customer ID.
Local Services Ads has its own reporting (Local Services Ads API / LSA reports).
Store in config/credentials.env (gitignored). Never print tokens.

## Read operations (no approval needed)
Search:
- Campaign/ad group/keyword performance: impressions, clicks, cost, conversions (calls + forms),
  cost per lead, conversion rate, impression share, budget-lost IS.
- Search terms report — find wasted spend (DIY queries, jobs out of area, unrelated trades).
- Call reporting: call extensions / calls from ads, call duration.

LSA:
- Lead volume, cost per lead, lead type (call vs message), booked vs not, review count/rating
  (LSA ranking is review-driven), and any disputed/credited leads.

Use GAQL for Search. Example — last 7 days by campaign, lead-focused:
```
SELECT campaign.name, metrics.cost_micros, metrics.conversions,
       metrics.cost_per_conversion, metrics.phone_calls
FROM campaign WHERE segments.date DURING LAST_7_DAYS
```

## Write operations (REQUIRE Glen's approval — spend gate)
- Adjust bids / target CPA / max CPC
- Change daily budgets (Search or LSA weekly budget)
- Add/pause keywords, add negative keywords
- Pause/enable campaigns or ad groups
- Edit geo-targeting / service-area radius

Before any write: show current value → proposed value → projected impact on **cost per booked job**
(use config/targets.yaml: target_cost_per_lead, target_cost_per_booking, lead_to_booking_rate).
After approved write: log to logs/ with full before/after.

## LSA lead disputes (recommend, don't auto-publish)
LSA charges per lead, including junk. Always scan for and recommend disputing:
- Spam / robocalls, wrong number, leads outside the service area.
- Jobs FreshFlow doesn't do (e.g. someone wanting HVAC repair, not vent cleaning).
Disputing recovers spend and protects cost-per-lead. Draft the dispute reason; Glen submits/approves.

## Keyword strategy for this trade
- Core intent: "dryer vent cleaning", "dryer vent cleaning near me", "[city] dryer vent cleaning",
  "air duct cleaning", "clothes dryer not drying" (problem-aware), "dryer vent cleaning cost".
- High-value modifiers: "professional", "licensed", "same day", landlord/property-manager terms.
- Negatives to protect spend: "DIY", "how to", "kit", "tools", "do it yourself", "jobs", "salary",
  "parts", and unrelated trades (HVAC repair, plumbing) unless FreshFlow offers them.

## Common diagnoses
- High cost, few leads → check search terms for DIY/out-of-area; recommend negatives + tighter geo.
- Lots of clicks, few calls → landing page / message-match problem (website skill) or call button
  hard to find on mobile (most local traffic is mobile).
- LSA cost per lead creeping up → push reviews (local-presence skill); LSA rank is review-driven.
- Budget-limited (lost IS >10%) in a peak month → recommend budget raise IF cost per booking is
  under target; cite seasonality in config/targets.yaml.
- Conversions reported but GA4/call log doesn't see them → tracking gap; flag (analytics skill).
