---
name: lead-response
description: Make sure every inbound lead (call, form, LSA/Meta message) gets a fast follow-up. Speed-to-lead and missed-call recovery win jobs. Use for lead follow-up, missed calls, and booking-rate tasks.
---

# Lead Response (speed-to-lead + missed-call recovery)

The cheapest new booked job is the lead FreshFlow already paid for but never called back. For home
services, **speed-to-lead is decisive** — contacting a lead within ~5 minutes vastly out-books an
hour-later callback. This skill keeps paid leads from going cold and turns missed calls into jobs.

## Data sources (read-only, no approval)
- Call tracking log (analytics skill): inbound calls, missed/abandoned calls, voicemail.
- Form submissions (website), Meta lead-form leads, LSA messages.
- Booking system / calendar (config/targets.yaml `website.booking_url`) to see which leads booked.
Reconcile these into one list: every lead, its source, timestamp, and whether it was contacted and booked.

## What to surface every cycle
- **Un-contacted leads** — any lead with no callback/reply. Top priority; these are paid-for and
  rotting. List them with source, time received, and how long they've waited.
- **Missed calls with no callback** — same; a missed call in this trade is a lost job.
- **Speed-to-lead** — median time from lead → first contact. Flag if it's drifting up.
- **Lead → booking rate** by source vs config/targets.yaml `lead_to_booking_rate`. A good lead
  source with a poor booking rate usually means slow/weak follow-up, not bad ads.

## Write / outbound (REQUIRE Glen's approval — customer-facing gate)
- Draft callback scripts and follow-up texts/emails for un-contacted leads; Glen (or the office)
  sends them. Never message a customer without approval.
- Draft a missed-call auto-text ("Sorry we missed you — this is FreshFlow, want to book your dryer
  vent cleaning?") for Glen to approve and enable.
- Recommend (don't auto-enable) a simple SLA: every lead contacted within X minutes during hours.

## How this ties to spend
Before recommending any budget increase, check this skill first. If leads are arriving but not being
contacted, the fix is follow-up, not more ad spend — say so plainly. Raising budget on a leaky
funnel just buys more wasted leads.

## Common diagnoses
- Cost per lead fine, cost per booking high → follow-up/booking gap, not an ad problem.
- Many missed calls clustered at certain hours → staffing/after-hours gap; recommend auto-text +
  ad scheduling (google-ads / meta-ads) to those hours only if they can be answered.
- Meta/LSA leads lower booking rate than search → set expectations + faster follow-up for colder
  channels; don't kill the channel on cost-per-lead alone.
