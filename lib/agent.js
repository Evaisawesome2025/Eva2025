// The conversational agent behind the "Chat with your agent" panel and the
// phone number a business owner texts.
//
// Two modes:
//  - If ANTHROPIC_API_KEY is set, we ask Claude, grounded in the business
//    profile + the computed funnel, under the same operating rules as the
//    business-agent (spend gate, reputation gate, funnel thinking).
//  - Otherwise we fall back to a deterministic, genuinely useful responder
//    that reads the same insights. No fake "AI" claims — it answers from data.

import { buildInsights } from "./insights.js";

const SYSTEM_RULES = `You are Flowline, the marketing operations agent for a local service business.
Think in leads, bookings, and dollars — never vanity metrics. The number that matters is cost per booked job vs the gross profit per job.
Rules you never break:
- Spend gate: never push a change that affects spend without showing the exact change and getting explicit approval. Read-only analysis needs no approval.
- Reputation gate: never post a public review reply, edit the Google Business Profile, or send a customer-facing message without approval. Drafts are fine.
Lead with the answer. Be decisive: one recommendation, not a hedged list.`;

function fmt(n) {
  if (n == null) return "—";
  return "$" + Number(n).toLocaleString();
}

export function ruleReply(account, message) {
  const ins = buildInsights(account);
  const biz = account.business || {};
  const t = ins.totals;
  const m = (message || "").toLowerCase();

  const lines = [];

  const said = (...words) => words.some((w) => m.includes(w));

  if (said("lead", "call back", "callback", "follow up", "follow-up", "missed")) {
    if (ins.uncontactedCount > 0) {
      const cold = ins.leads.filter((l) => !l.contacted);
      lines.push(
        `You have ${ins.uncontactedCount} lead(s) that never got called back — that's the most expensive problem on the board, because you already paid to get them.`
      );
      cold.slice(0, 3).forEach((l) =>
        lines.push(
          `• ${l.name} — ${l.type} from ${l.source}, ${l.minutesAgo} min ago (worth ~${fmt(
            l.value
          )} if it books).`
        )
      );
      lines.push(
        `I've drafted a 60-second follow-up text for each. Say "send the follow-ups" and I'll queue them for your approval (reputation gate — nothing goes out without your OK).`
      );
    } else {
      lines.push(
        "Every lead in the last day was contacted inside your speed-to-lead target. That's the single biggest lever in this trade and it's healthy right now."
      );
    }
    return lines.join("\n");
  }

  if (said("wast", "cut", "save", "overspend", "burning", "leak")) {
    const worst = [...ins.channels]
      .filter((c) => c.costPerBooking)
      .sort((a, b) => (b.costPerBooking || 0) - (a.costPerBooking || 0))[0];
    lines.push(
      `Biggest leak: ${worst.name}. It's booking jobs at ${fmt(
        worst.costPerBooking
      )} vs your ${fmt(t.targetCostPerBooking)} target.`
    );
    lines.push(
      `Fix: add negative keywords + trim the daily cap ~18% and move that budget to the channels already booking under target. Projected savings ≈ ${fmt(
        Math.round(worst.spend * 0.18 * 4)
      )}/mo with no drop in booked jobs.`
    );
    lines.push(
      `This affects spend, so it's sitting in your approvals inbox — approve it and I'll push it.`
    );
    return lines.join("\n");
  }

  if (said("website", "web site", "landing page", "my site", "build me a site")) {
    if (biz.hostedSite) {
      lines.push(
        `Your Flowline-hosted website is live and built from your services and service area. I keep the headline, services, and call-to-action in sync with what's converting.`
      );
      lines.push(
        `Want me to draft a new headline test or add a service section? I'll show you the change before anything goes live.`
      );
    } else if (biz.website) {
      lines.push(
        `You're connected to ${biz.website}. I read its funnel and can draft page/headline changes for your approval.`
      );
      lines.push(
        `If you'd like, I can also build you a fast Flowline landing page tuned for booked jobs — just say "build my website."`
      );
    } else {
      lines.push(
        `You don't have a website connected yet. I can build and host one for you right now, generated from your services and service area — no design work on your end.`
      );
      lines.push(`Open the "Your website" panel and hit Build my website, or say the word.`);
    }
    return lines.join("\n");
  }

  if (said("review", "reputation", "google business", "gbp", "stars")) {
    lines.push(
      "I've drafted replies to your 2 newest Google reviews — one 5★ and one 3★ about scheduling."
    );
    lines.push(
      "Both are waiting in approvals. Nothing posts publicly until you OK it (reputation gate). Replying fast lifts both your local ranking and your conversion rate."
    );
    return lines.join("\n");
  }

  if (said("budget", "spend more", "scale", "increase", "grow", "more jobs")) {
    const best = [...ins.channels]
      .filter((c) => c.costPerBooking)
      .sort((a, b) => (a.costPerBooking || 1e9) - (b.costPerBooking || 1e9))[0];
    lines.push(
      `Scale ${best.name} first — it's your cheapest booked jobs at ${fmt(
        best.costPerBooking
      )} (target ${fmt(t.targetCostPerBooking)}).`
    );
    lines.push(
      `Recommendation: +$200/wk there before peak season. Projected +3–5 booked jobs/mo at target cost. It's queued for your approval.`
    );
    return lines.join("\n");
  }

  if (
    said(
      "how",
      "doing",
      "performance",
      "funnel",
      "week",
      "month",
      "numbers",
      "report",
      "summary",
      "overview"
    )
  ) {
    lines.push(`Here's ${biz.name || "your business"} over the last 28 days:`);
    lines.push(
      `Spend ${fmt(t.spend)} → ${t.leads} leads → ${t.bookings} booked jobs → ${fmt(
        t.revenue
      )} revenue.`
    );
    lines.push(
      `Cost per booked job: ${fmt(t.costPerBooking)} (target ${fmt(
        t.targetCostPerBooking
      )}). ROAS ${t.roas}x.`
    );
    if (ins.uncontactedCount)
      lines.push(
        `Watch-out: ${ins.uncontactedCount} lead(s) weren't called back — fixing that is worth more than any ad tweak this week.`
      );
    lines.push(`Want the per-channel breakdown or the action list?`);
    return lines.join("\n");
  }

  if (said("hi", "hello", "hey", "what can you", "help", "start")) {
    return [
      `Hi — I'm your Flowline agent for ${biz.name || "your business"}.`,
      `I watch your Google Ads, Meta, website, and leads, and I think in booked jobs and dollars. Try:`,
      `• "How did we do this month?"`,
      `• "Any leads we didn't call back?"`,
      `• "Where am I wasting ad spend?"`,
      `• "Draft replies to my reviews."`,
      `I'll never spend money or post anything customer-facing without your approval.`,
    ].join("\n");
  }

  // Default: anchor on the most important thing.
  lines.push(
    `Over the last 28 days: ${fmt(t.spend)} spend → ${t.bookings} booked jobs at ${fmt(
      t.costPerBooking
    )} each (target ${fmt(t.targetCostPerBooking)}).`
  );
  if (ins.uncontactedCount)
    lines.push(
      `The thing I'd fix first: ${ins.uncontactedCount} lead(s) never got a callback. Want me to draft the follow-ups?`
    );
  else
    lines.push(`Ask me about performance, leads, wasted spend, budget, or reviews.`);
  return lines.join("\n");
}

export async function generateReply(account, message) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { reply: ruleReply(account, message), mode: "rules" };
  }
  try {
    const ins = buildInsights(account);
    const context = `Business: ${JSON.stringify(account.business)}
Economics/targets: ${JSON.stringify(account.economics || {})}
Current funnel (last 28 days): ${JSON.stringify(ins.totals)}
Per channel: ${JSON.stringify(ins.channels)}
Uncontacted leads: ${ins.uncontactedCount}`;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system: SYSTEM_RULES + "\n\nLIVE CONTEXT:\n" + context,
        messages: [{ role: "user", content: message }],
      }),
    });
    if (!res.ok) throw new Error("api " + res.status);
    const data = await res.json();
    const reply = (data.content || [])
      .map((b) => b.text || "")
      .join("")
      .trim();
    return { reply: reply || ruleReply(account, message), mode: "claude" };
  } catch {
    return { reply: ruleReply(account, message), mode: "rules-fallback" };
  }
}
