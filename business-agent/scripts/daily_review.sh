#!/usr/bin/env bash
# FreshFlow scheduled business review. Add to cron, e.g. daily at 7am:
#   0 7 * * * /full/path/business-agent/scripts/daily_review.sh
#
# Runs Claude Code headless against this project so the agent executes its
# standard cycle, auto-applies safe changes, and writes anything that spends
# money or faces a customer to a file Glen reviews. Nothing that affects spend
# or a customer (review replies, GBP edits, outbound messages) executes without approval.

cd "$(dirname "$0")/.." || exit 1
mkdir -p logs
STAMP=$(date +%Y-%m-%d)

claude -p "Run the standard review cycle from CLAUDE.md for the last 7 and 28 days.
Pull all surfaces (Google Ads + LSA, Meta, website, Google Business Profile/reviews, GA4 +
Search Console + call tracking). Build the funnel: spend -> leads -> bookings -> revenue per channel,
and compute cost per lead and cost per booking vs config/targets.yaml.
Auto-execute and log [AUTO-OK] items. List any leads that were not contacted (lead-response skill).
Write the prioritized [APPROVE] action list (spend changes, LSA disputes, review-reply drafts,
GBP edits, outbound messages) to logs/pending-approval-${STAMP}.md.
Do NOT execute any spend or customer-facing change. End with a 5-line summary that states the
cost per booked job and the single highest-impact next action." \
  --permission-mode acceptEdits \
  >> "logs/review-${STAMP}.log" 2>&1

echo "Review complete. Approvals needed: logs/pending-approval-${STAMP}.md"
