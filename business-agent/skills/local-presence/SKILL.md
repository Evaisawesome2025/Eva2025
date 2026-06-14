---
name: local-presence
description: Manage FreshFlow's Google Business Profile, reviews/reputation, and Local Services Ads profile — the #1 lead driver for a local trade. Use for GBP, reviews, ratings, or LSA-profile tasks.
---

# Local Presence (Google Business Profile + Reviews + LSA profile)

For a local dryer-vent business, this is usually the **single biggest source of cheap booked jobs**.
People search "dryer vent cleaning near me," see the map pack and LSA, and pick by proximity + rating
+ review count. Winning here lowers cost per lead everywhere else.

## Auth
- Google Business Profile: Business Profile APIs (OAuth) or the GBP dashboard. Need the location ID
  (config/targets.yaml `local_presence.google_business_profile_id`).
- Reviews: read via the Business Profile API; LSA reviews via Local Services.
Store creds in config/credentials.env (gitignored). Never print tokens.

## Read operations (no approval)
- Profile completeness: categories, service area, services list, hours, photos, attributes
  (licensed, locally owned), booking link, phone (use the tracked number).
- Reviews: count, average rating, recent reviews, which need a reply, rating trend.
- GBP insights: searches (discovery vs direct), calls from listing, direction/website clicks.
- LSA profile: review count/rating (drives LSA rank), responsiveness, Google Guaranteed status.

## Write operations (REQUIRE Glen's approval — reputation/customer-facing gate)
- **Review replies** — draft every reply; Glen approves before it posts. Thank positives, name the
  service; respond to negatives calmly, take it offline, never argue or share customer details.
- **GBP edits** — services, description, hours, attributes, posts/offers.
- **Photos** — add before/after and team/truck photos (fresh photos help ranking + trust).
- **GBP Posts** — seasonal offers, fire-safety tips (great in peak_months).
- **Review requests** — draft the ask-for-review message/flow for happy customers (config
  `review_request_after_job`). Sending is customer-facing → approval.

Before any write: show current → proposed → why. After approval: publish, log it.

## Why reviews are the lever
- More + fresher 4.8★+ reviews → higher map-pack and LSA rank → more leads at lower cost.
- Protect config/targets.yaml `review_target_rating`. If rating dips, that's a top-priority flag.
- A steady review-request habit after every happy job is the highest-ROI marketing FreshFlow has —
  recommend it whenever review velocity stalls.

## Common diagnoses
- Few leads from GBP / low map-pack visibility → incomplete profile, thin reviews, or wrong primary
  category ("Air duct cleaning service" / "Dryer vent cleaning service"). Recommend fixes.
- LSA cost per lead high / rank low → push review velocity and responsiveness; LSA ranks on both.
- Recent negative review → draft a reply for approval immediately and flag the root cause.
- Discovery searches low → add service-area + service detail, GBP posts, and more photos.
