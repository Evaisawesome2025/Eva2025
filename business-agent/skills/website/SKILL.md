---
name: website
description: Read and edit FreshFlow's website — landing pages, booking flow, trust signals, calls-to-action, local/SEO copy. Use for any website content or page task.
---

# Website

The site has one job: turn a visitor into a **call or booking**. For a local trade, most traffic is
mobile and high-intent ("my dryer takes forever, is my vent clogged?"). The page must answer fast,
build trust, and make contacting FreshFlow effortless.

## Auth / access (set per FreshFlow's actual stack — see config/targets.yaml `website.platform`)
- **WordPress** → REST API (application password) for read/edit posts & pages.
- **Headless/static (Vercel/Netlify + git)** → edit files in the repo, commit, push; deploy hook runs.
- **Other CMS** → that platform's API.
Store creds/repo path in config/credentials.env (gitignored).

## Read operations (no approval)
- Fetch page content, headlines, CTAs, meta titles/descriptions.
- Check message match: does the landing page say the same thing as the ad that sent the click?
- Check the conversion essentials are present and above the fold (see checklist below).

## Write operations (REQUIRE Glen's approval — anything live-facing)
- Edit landing page copy, headlines, CTAs, offers.
- Update meta titles/descriptions and local/service-area SEO content.
- Add/update service-area pages, before/after galleries, FAQ, pricing.
- Publish/unpublish pages.

Before any write: show current copy → proposed copy → why, tied to a metric. After approval: make
the change, record the deploy, log it.

## Conversion checklist for a dryer-vent site (audit pages against this)
- **Phone number tap-to-call in the header**, visible without scrolling on mobile.
- Clear primary CTA matching config/targets.yaml `primary_cta` (call / book online / form).
- Trust signals up top: licensed & insured, local, # of reviews + star rating, "Google Guaranteed"
  badge if running LSA.
- The problem + the fix: clogged vent = fire risk + longer dry times + higher energy bills.
- Before/after photos (lint proof sells this trade).
- Service area named in text (cities from config/targets.yaml) for local SEO + reassurance.
- Pricing or "free quote" so visitors aren't afraid to call.
- Fast load on mobile; short form (name, phone, address) — every extra field loses leads.

## Role in the cycle
The website is where ad clicks and organic/GBP visits convert (or don't). When analytics shows
traffic with weak booking rate, this is usually the fix point: tighten message match between ad and
page, make the call button impossible to miss, add proof, cut form friction. Always tie a proposed
edit back to a metric from analytics (bounce, call rate, form completion).
