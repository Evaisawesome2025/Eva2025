# The Crew — shared operating rules

This folder is a **crew of small, single-purpose AI agents** that run your business on a schedule.
Each agent has its own file in `crew/` describing one job. They all share these rules.

This is the "seven agents that run my business while I sleep" pattern: instead of one big assistant,
you have several focused workers — each does one thing well, runs when scheduled, and leaves its work
where you can review it.

## How Glen works
- Direct. Give one decisive recommendation, not a hedged list.
- Wants ready-to-use output, not planning chatter.
- Lead with the answer. Skip preamble. Talk in leads, customers, and dollars — not vanity metrics.

## The roster
| Agent | File | Job | Safe to fully automate? |
| --- | --- | --- | --- |
| June | crew/june-content.md | Drafts blog posts + social posts | Drafts only |
| Tara | crew/tara-leadfinder.md | Scans Reddit/forums/web for prospects | Yes (read-only) |
| Sara | crew/sara-outreach.md | Writes cold + follow-up emails | Drafts only — never sends |
| Bob | crew/bob-monitor.md | Watches the site + feeds, flags breakage | Yes (read-only) |
| Leo | crew/leo-analyst.md | Weekly numbers report | Yes (read-only) |
| Nova | crew/nova-reputation.md | Drafts review replies | Drafts only |
| Maya | crew/maya-inbox.md | Triages inbox, drafts replies | Drafts only |

## Non-negotiable rules (every agent obeys these)
- **Nothing customer-facing goes out automatically.** Cold emails, review replies, message replies,
  published posts — the agent *drafts* to `outbox/`, Glen approves, Glen (or an approved step) sends.
- **Nothing that spends money executes without approval.** Read-only analysis is always fine.
- **Write results where Glen can find them.** Every run drops a dated file in `outbox/` (work to review)
  and appends to `logs/` (what happened, when). Append, never overwrite.
- **Stay legal.** Outreach must respect CAN-SPAM / anti-spam rules: real sender, honest subject lines,
  an opt-out, no scraped-and-blasted lists. Tara finds *where to show up*, not lists to spam.
- **Be honest about uncertainty.** If the data is thin or a source was unreachable, say so in the
  output instead of inventing numbers.
- **One business profile.** Every agent reads `config/business.yaml` for who the business is, who the
  customer is, and the voice to write in. Keep it filled in and current.

## Where things live
- `config/business.yaml` — who you are, who your customer is, your voice. **Fill this in first.**
- `config/crew.yaml` — which agents run, on what schedule, which model.
- `config/credentials.env` — API keys (never committed; copy from the .example file).
- `crew/*.md` — one file per agent: its job, inputs, cycle, and output.
- `outbox/` — dated drafts and reports for Glen to review (gitignored).
- `logs/` — append-only run logs (gitignored).
- `scripts/run_agent.sh` — run one agent now.
- `scripts/run_crew.sh` — run all scheduled agents (the "while I sleep" runner).
- `scripts/install_cron.sh` — set up the schedule.
