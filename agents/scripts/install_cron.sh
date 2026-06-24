#!/usr/bin/env bash
# Install the schedule from config/crew.yaml into your crontab, so the crew runs on its own.
# Each enabled agent gets its own cron line using its `schedule:`. Re-run any time to update.
#   ./scripts/install_cron.sh           # install/update
#   ./scripts/install_cron.sh --remove  # take the crew back off cron

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
DIR="$(pwd)"
TAG="# crew-agents:${DIR}"

# Always start from a crontab with our previous lines stripped out.
CURRENT=$(crontab -l 2>/dev/null | grep -v "$TAG" || true)

if [[ "${1:-}" == "--remove" ]]; then
  printf "%s\n" "$CURRENT" | crontab -
  echo "Removed crew cron entries for $DIR"
  exit 0
fi

# Parse name + enabled + schedule out of crew.yaml and emit a cron line per enabled agent.
LINES=$(awk -v dir="$DIR" -v tag="$TAG" '
  /^  [a-z]+:/   { name=$1; sub(":","",name); en=0; sched="" }
  /enabled: true/ { en=1 }
  /schedule:/    { s=$0; sub(/.*schedule: *"/,"",s); sub(/".*/,"",s); sched=s
                   if (en==1 && sched!="") printf "%s %s/scripts/run_agent.sh %s %s\n", sched, dir, name, tag }
' config/crew.yaml)

if [[ -z "$LINES" ]]; then
  echo "No enabled agents with schedules in config/crew.yaml — nothing to install."
  exit 0
fi

{ printf "%s\n" "$CURRENT"; printf "%s\n" "$LINES"; } | crontab -
echo "Installed crew schedule:"
printf "%s\n" "$LINES"
echo "View any time with: crontab -l"
