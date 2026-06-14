---
name: meta-ads
description: Read and manage FreshFlow's Meta (Facebook/Instagram) Ads — local lead-gen, metrics, budgets, audiences, creative. Use for any Meta Ads task.
---

# Meta Ads (Facebook / Instagram)

For a local dryer-vent business, Meta is a **demand-generation + retargeting** channel, not pure
intent like search. It works best for: seasonal fire-safety awareness, before/after proof, offers
to homeowners in the service area, and retargeting people who visited the site but didn't book.

## Auth
Meta Marketing API (Graph API). Requires: app ID/secret, long-lived access token, ad account ID.
Store in config/credentials.env (gitignored).

## Read operations (no approval needed)
- Campaign/ad set/ad insights: spend, impressions, reach, CPM, CPC, CTR, results (leads/calls),
  cost per lead, frequency.
- Breakdown by age/gender/placement/platform/zip — find which homeowners/areas convert.
- Creative-level performance (which hook/photo wins — usually before/after or fire-safety angle).
- Lead-form leads: volume, cost per lead, and whether they've been followed up (lead-response skill).

## Write operations (REQUIRE Glen's approval — spend gate)
- Change ad set / campaign budgets (daily or lifetime)
- Edit audiences (service-area radius, homeowner targeting, lookalikes, retargeting windows)
- Pause/enable campaigns, ad sets, or ads
- Pause fatigued creative (frequency high, CTR falling)

Before any write: current → proposed → projected impact on cost per booked job (config/targets.yaml).
Log after.

## What works for this trade
- **Geo + homeowner targeting:** lock to the service-area cities/radius; homeowners, not renters,
  unless chasing landlord/property-manager accounts (those convert big — recurring multi-unit work).
- **Hooks that sell:** fire-safety stat ("dryer fires cause thousands of home fires a year"),
  "drying takes 2+ cycles? your vent is clogged", before/after lint photos, local + licensed proof.
- **Instant/lead forms or click-to-call** beat sending cold traffic to a long page.
- **Retargeting:** anyone who hit the site or watched an ad video — cheap, high-intent.

## Common diagnoses
- Frequency >2.5 with falling CTR → creative fatigue; rotate in a new before/after or seasonal hook.
- Cheap leads, no booked jobs → lead quality or slow follow-up (lead-response skill); check the
  call/booking log before raising budget.
- High CPM on a placement → recommend trimming that placement.
- Good CTR, weak conversion → landing page mismatch (website skill) or tracking gap (analytics skill).
- Learning phase stuck → ad set has too few lead events; recommend consolidating budget/audiences.
