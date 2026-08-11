#!/usr/bin/env bash
# Run every ENABLED agent in config/crew.yaml, one after another. This is the
# "while I sleep" runner — point cron at it, or run it by hand to see the whole crew work.
#   ./scripts/run_crew.sh

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

# Pull the names of agents marked enabled: true from crew.yaml (simple YAML, no deps).
ENABLED=$(awk '
  /^  [a-z]+:/ { name=$1; sub(":","",name) }
  /enabled: true/ { print name }
' config/crew.yaml)

if [[ -z "$ENABLED" ]]; then
  echo "No agents enabled in config/crew.yaml. Set enabled: true on the ones you want."
  exit 0
fi

echo "[$(date)] crew run starting. Enabled: $ENABLED" | tee -a logs/crew.log
for AGENT in $ENABLED; do
  echo ">>> $AGENT"
  ./scripts/run_agent.sh "$AGENT" || echo "!! $AGENT failed (see logs/) — continuing"
done
echo "[$(date)] crew run complete. Review everything in outbox/." | tee -a logs/crew.log
