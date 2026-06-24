#!/usr/bin/env bash
# Run ONE agent by name, right now. Example:
#   ./scripts/run_agent.sh tara
#   ./scripts/run_agent.sh june
#
# Runs Claude Code headless against this crew folder so the named agent does its job,
# writes its work to outbox/, and logs to logs/. Customer-facing output is drafted, never sent.

set -euo pipefail
cd "$(dirname "$0")/.." || exit 1

AGENT="${1:-}"
if [[ -z "$AGENT" ]]; then
  echo "Usage: $0 <agent-name>   (june | tara | sara | bob | leo | nova | maya)"
  exit 1
fi

DEF="crew/${AGENT}-"*.md
FILE=$(ls $DEF 2>/dev/null | head -1 || true)
if [[ -z "$FILE" ]]; then
  echo "No agent definition found for '$AGENT' in crew/. Available:"
  ls crew/
  exit 1
fi

mkdir -p outbox logs
STAMP=$(date +%Y-%m-%d)

# Load credentials if present (ANTHROPIC_API_KEY etc.)
[[ -f config/credentials.env ]] && set -a && . config/credentials.env && set +a

echo "[$(date)] running $AGENT" | tee -a "logs/crew.log"

claude -p "You are the agent defined in $FILE. Read that file, read ../CLAUDE.md for the shared crew
rules, and read config/business.yaml for the business. Then do your job for today exactly as your
definition describes. Write your output to the outbox/ path named in your definition (use today's
date ${STAMP}) and append your one-line summary to your log file. Obey every rule: nothing
customer-facing is sent or published — you draft to outbox/ only. If a needed input or credential is
missing, do what you can and clearly note the gap in your output." \
  --permission-mode acceptEdits \
  >> "logs/${AGENT}-run-${STAMP}.log" 2>&1

echo "Done. Review: outbox/${AGENT}-*-${STAMP}.md"
