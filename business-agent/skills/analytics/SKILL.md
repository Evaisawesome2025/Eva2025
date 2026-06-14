---
name: analytics
description: Read GA4, Search Console, and call tracking — traffic, leads, bookings, cost per lead, attribution, organic/local performance. Use for any analytics or attribution question.
---

# Analytics (GA4 + Search Console + Call Tracking)

For FreshFlow, analytics exists to answer one question per channel: **how much did a booked job
cost, and where did it come from?** Phone calls are the main lead type for this trade, so call
tracking is part of analytics — not an afterthought.

## Auth
- GA4: Google Analytics Data API (service account JSON or OAuth). Need property ID.
- Search Console: Search Console API. Need verified site URL.
- Call tracking: provider API (CallRail / WhatConverts / etc. — see config/targets.yaml). Need
  account/API key. This is the source of truth for phone leads.
Store creds in config/credentials.env / config/ (gitignored).

## Read operations (all read-only, no approval)
GA4:
- Traffic by source/medium/campaign; sessions; engagement rate.
- Lead events (call clicks, form submits, booking starts/completions) and value by channel.
- Landing page performance, funnel drop-off, mobile vs desktop.
- Compare paid vs organic vs Google Business Profile vs direct.

Search Console:
- Queries, clicks, impressions, CTR, average position — especially "[city] dryer vent cleaning".
- Pages gaining/losing organic visibility; service-area pages.

Call tracking:
- Calls by source (which ad/keyword/GBP listing drove the call), duration, first-time vs repeat.
- Only count calls ≥ config/targets.yaml `min_call_seconds_as_lead` as real leads.
- Missed/abandoned calls — these are lost jobs; flag them to lead-response.

## Role in the cycle — the referee
Ad platforms over-report their own conversions. Build the true funnel here:
**spend → clicks → leads (calls + forms) → booked jobs → revenue**, per channel, and compute
cost per lead and cost per booking against config/targets.yaml. When Google Ads says 20 conversions
but the call log + GA4 show 12 real leads, **flag the gap — don't average it.** GA4 + call tracking
is the cross-channel comparison layer.

## Common diagnoses
- Paid traffic up, bookings flat → landing page/offer problem (website skill) or slow follow-up
  (lead-response skill), not an ad problem.
- Lots of calls under 30s → spam or wrong-number / IVR friction; check call handling.
- Organic "[city] dryer vent cleaning" position slipping → content refresh / service-area page
  (website skill) + reviews push (local-presence skill).
- Channel claiming leads GA4/call log doesn't see → tracking/attribution issue; fix before trusting it.
- Booking rate drops on mobile → mobile UX/call-button issue (website skill).

## Seasonality read
Compare year-over-year and month-over-month against config/targets.yaml `seasonality`. Heading into
peak_months, expect demand to rise — recommend leaning budget in early. In slow_months, expect
higher cost per lead — recommend trimming spend but keeping LSA + GBP on.
