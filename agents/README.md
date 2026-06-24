# The Crew — AI agents that run your business while you sleep

Seven small AI agents, each with one job, that run on a schedule and leave their work where you can
review it. This is the "I built seven agents with Claude that run my business" setup — built honestly,
with the safety rails that keep you out of trouble.

| Agent | Job |
| --- | --- |
| **June** | Writes blog + social post drafts in your voice |
| **Tara** | Scans Reddit / forums / the web for people who need what you sell |
| **Sara** | Writes cold + follow-up emails (drafts — you send) |
| **Bob** | Watches your site & money path 24/7, flags anything broken |
| **Leo** | Sends you a 2-minute weekly numbers report |
| **Nova** | Drafts replies to your reviews |
| **Maya** | Sorts your inbox and drafts replies |

## What's real, and what it costs (no hype)
- **Real:** these agents genuinely run on a schedule and produce real work — posts, lead lists,
  email drafts, health checks, reports.
- **Honest limits:** anything customer-facing (cold emails, review replies, message replies) is
  **drafted, never auto-sent.** You approve it. That's a feature — it keeps you compliant and in control.
- **It costs money to run:** the agents use the Claude API, which is pay-per-use and **separate from a
  Claude Pro subscription.** Get a key at https://console.anthropic.com. Each agent run is typically a
  few cents to a few dimes depending on length.

## Setup (about 10 minutes)
1. **Install Claude Code** (the thing that runs the agents):
   ```
   npm install -g @anthropic-ai/claude-code
   ```
2. **Add your API key:**
   ```
   cd agents
   cp config/credentials.env.example config/credentials.env
   # open config/credentials.env and paste your ANTHROPIC_API_KEY
   ```
3. **Tell the crew about your business** — open `config/business.yaml` and replace every `REPLACE_ME`.
   This one file is what makes the output sound like *you* instead of generic AI. Fill it in honestly.

## Try one agent right now
```
cd agents
./scripts/run_agent.sh tara      # safe, read-only — finds prospects
```
Then open the file it created in `outbox/`. Tara and Bob and Leo are read-only and safe to run anytime.

## Run the whole crew
```
./scripts/run_crew.sh            # runs every agent marked enabled in config/crew.yaml
```
Everything lands in `outbox/` (work to review) and `logs/` (what ran).

## Put it on autopilot (the "while I sleep" part)
```
./scripts/install_cron.sh        # schedules each enabled agent from config/crew.yaml
crontab -l                       # see the schedule
./scripts/install_cron.sh --remove   # turn autopilot off
```
By default **June, Tara, Bob, and Leo are on** (they're safe to automate). **Sara, Nova, and Maya are
off** until you wire up their inputs — flip `enabled: true` in `config/crew.yaml` when ready.

## Turn agents on/off and change timing
Everything is in `config/crew.yaml`: `enabled: true/false` and a cron `schedule:` per agent. Want June
on Wednesdays instead of Mondays? Change one line and re-run `install_cron.sh`.

## How it's wired (for the curious)
Each agent is just a markdown job description in `crew/`. The runner (`scripts/run_agent.sh`) launches
Claude Code headless (`claude -p`) pointed at that description plus your `business.yaml`, and the agent
does the work and writes to `outbox/`. No magic, no lock-in — you can read and edit every agent's
instructions in plain English.

## Your safety rails (always on)
- Nothing customer-facing is sent or published automatically — drafts only.
- Nothing that spends money runs without you.
- Outreach is built to respect anti-spam law (real sender, opt-out, no scraped lists).
- Every run is logged. Nothing happens you can't see.
