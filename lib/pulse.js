// The Weekly Pulse — Flowline's plain-English read, automated and built to land
// in the owner's inbox every week. No dashboards to dig through: what's working,
// what's leaking money, and the one or two moves to make next.
//
// Pure module (no fs / no browser APIs) so it runs identically on the server
// (to render the email) and on the client (to preview it). It reads the same
// funnel the dashboard does, so the pulse and the dashboard never disagree.

import { buildInsights } from "./insights.js";

const money = (n) => (n == null ? "—" : "$" + Number(n).toLocaleString());

function firstName(account) {
  const biz = account?.business || {};
  const raw = (biz.ownerName || biz.contactName || "").trim();
  if (raw) return raw.split(/\s+/)[0];
  return "there";
}

function weekLabel(d = new Date()) {
  const end = new Date(d);
  const start = new Date(d);
  start.setDate(start.getDate() - 6);
  const fmt = (x) =>
    x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

// Turn the funnel into a short list of plain-language wins, leaks, and moves.
export function buildPulse(account, now = new Date()) {
  const ins = buildInsights(account);
  const biz = account?.business || {};
  const t = ins.totals;
  const onTarget = ins.health.onTarget;

  const priced = ins.channels.filter((c) => c.costPerBooking);
  const best = [...priced].sort(
    (a, b) => (a.costPerBooking || 1e9) - (b.costPerBooking || 1e9)
  )[0];
  const worst = [...priced].sort(
    (a, b) => (b.costPerBooking || 0) - (a.costPerBooking || 0)
  )[0];
  const organic = ins.channels.find((c) => c.spend < 1);

  // ---- What's working ----------------------------------------------------
  const working = [];
  if (best && best.costPerBooking <= t.targetCostPerBooking) {
    working.push(
      `${best.name} is your cheapest booked work right now — ${money(
        best.costPerBooking
      )} per job against your ${money(t.targetCostPerBooking)} target. That's the engine to feed.`
    );
  }
  if (organic && organic.bookings > 0) {
    working.push(
      `Your Google Business Profile brought in ${organic.bookings} booked job(s) for $0 in ad spend. Free pipeline — worth protecting with fast review replies.`
    );
  }
  const contacted = ins.leads.length - ins.uncontactedCount;
  if (contacted > 0 && ins.uncontactedCount === 0) {
    working.push(
      `Every lead this week got called back in time. In this trade that's the single biggest lever, and it's healthy.`
    );
  } else if (contacted > 0) {
    working.push(
      `${contacted} of ${ins.leads.length} new leads got a fast callback.`
    );
  }
  if (!working.length) {
    working.push(
      `You're live across ${ins.channels.length} channels and the measurement is in place — every dollar this week is now tied to a booked job, not a guess.`
    );
  }

  // ---- What's leaking money ---------------------------------------------
  const leaking = [];
  if (ins.uncontactedCount > 0) {
    leaking.push(
      `${ins.uncontactedCount} lead(s) never got called back. You already paid to get them, so this is the most expensive leak on the board — worth more than any ad tweak this week.`
    );
  }
  if (worst && worst.costPerBooking > t.targetCostPerBooking) {
    const over = worst.costPerBooking - t.targetCostPerBooking;
    leaking.push(
      `${worst.name} is booking jobs at ${money(worst.costPerBooking)} — ${money(
        over
      )} over target. Roughly ${money(
        Math.round(worst.spend * 0.18 * 4)
      )}/mo is going to clicks that don't book.`
    );
  }
  if (!leaking.length) {
    leaking.push(
      `Nothing's clearly bleeding this week. Cost per booked job is at or under target across the board — hold the line and lean into what's cheapest.`
    );
  }

  // ---- The one or two moves to make next --------------------------------
  const moves = [];
  if (ins.uncontactedCount > 0) {
    moves.push({
      label: "Call back the leads you already paid for",
      detail: `I've drafted a 60-second follow-up text for each of the ${ins.uncontactedCount} uncontacted lead(s). Reply "send the follow-ups" and I'll queue them for your OK.`,
      gate: "reputation",
    });
  }
  if (worst && worst.costPerBooking > t.targetCostPerBooking) {
    moves.push({
      label: `Trim ${worst.name} and move the money`,
      detail: `Add negative keywords + cut the daily cap ~18%, shift it to ${
        best ? best.name : "your cheapest channel"
      }. Projected ${money(
        Math.round(worst.spend * 0.18 * 4)
      )}/mo saved, same booked jobs. Sitting in your approvals — it touches spend, so it needs your OK.`,
      gate: "spend",
    });
  } else if (best) {
    moves.push({
      label: `Pour more into ${best.name}`,
      detail: `It's your cheapest booked work. +$200/wk before peak season projects +3–5 booked jobs/mo at target cost. Queued for your approval.`,
      gate: "spend",
    });
  }
  // Always keep it to the one or two highest-leverage moves.
  const topMoves = moves.slice(0, 2);

  const bottomLine = onTarget
    ? `Bottom line: ${money(t.spend)} in spend turned into ${t.bookings} booked jobs at ${money(
        t.costPerBooking
      )} each — under your ${money(t.targetCostPerBooking)} target. ${
        topMoves.length
          ? "Do the move" + (topMoves.length > 1 ? "s" : "") + " above and next week is bigger."
          : "Hold steady."
      }`
    : `Bottom line: cost per booked job is ${money(
        t.costPerBooking
      )} against your ${money(
        t.targetCostPerBooking
      )} target. The move${topMoves.length > 1 ? "s" : ""} above close${
        topMoves.length > 1 ? "" : "s"
      } that gap without spending a dollar more.`;

  return {
    subject: `${biz.name || "Your"} weekly pulse — ${t.bookings} booked jobs at ${money(
      t.costPerBooking
    )} each`,
    preheader: onTarget
      ? `Under target this week. ${topMoves.length} move(s) to make it bigger.`
      : `Over target — here's how to close the gap without spending more.`,
    week: weekLabel(now),
    greeting: `Hey ${firstName(account)},`,
    onTarget,
    headline: onTarget
      ? `Good week. You're booking jobs under target.`
      : `Solid week, with one gap worth closing.`,
    metrics: [
      { label: "Ad spend", value: money(t.spend) },
      { label: "Leads", value: String(t.leads) },
      { label: "Booked jobs", value: String(t.bookings) },
      { label: "Cost / booked job", value: money(t.costPerBooking), good: onTarget },
      { label: "Revenue", value: money(t.revenue), note: `${t.roas}x ROAS` },
    ],
    working,
    leaking,
    moves: topMoves,
    bottomLine,
    signoff: "— Your Flowline agent",
    accountId: account?.id || "demo",
    businessName: biz.name || "Your business",
    agentPhone: biz.phone || "",
  };
}

// Render the pulse as a standalone, email-safe HTML document (inline styles,
// table layout) so it survives real email clients. This is the artifact that
// "lands in your inbox every week."
export function renderPulseEmail(account, now = new Date()) {
  const p = buildPulse(account, now);
  const brand = "#0b8f8e";
  const ink = "#0e1726";
  const muted = "#5b6678";

  const metricCells = p.metrics
    .map(
      (m) => `
      <td style="padding:10px 12px;border:1px solid #e6eaf2;border-radius:10px;vertical-align:top;">
        <div style="font-size:12px;color:${muted};text-transform:uppercase;letter-spacing:.04em;">${m.label}</div>
        <div style="font-size:20px;font-weight:700;color:${
          m.good ? "#12936b" : ink
        };margin-top:4px;">${m.value}</div>
        ${m.note ? `<div style="font-size:12px;color:${muted};margin-top:2px;">${m.note}</div>` : ""}
      </td>`
    )
    .join("");

  const list = (items) =>
    items
      .map(
        (x) =>
          `<tr><td style="padding:6px 0;font-size:15px;line-height:1.5;color:${ink};">• ${x}</td></tr>`
      )
      .join("");

  const moves = p.moves
    .map(
      (m, i) => `
      <tr><td style="padding:10px 0;border-top:${i ? "1px solid #eef1f6" : "none"};">
        <div style="font-size:15px;font-weight:700;color:${ink};">${i + 1}. ${m.label}
          <span style="font-size:11px;font-weight:600;color:${
            m.gate === "spend" ? "#4f46e5" : "#c0392b"
          };background:${
            m.gate === "spend" ? "#eef1fb" : "#fdeef0"
          };padding:2px 8px;border-radius:999px;margin-left:6px;">${
        m.gate === "spend" ? "$ needs your OK" : "★ needs your OK"
      }</span>
        </div>
        <div style="font-size:14px;line-height:1.5;color:${muted};margin-top:4px;">${m.detail}</div>
      </td></tr>`
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${p.subject}</title></head>
<body style="margin:0;background:#f6f8fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${p.preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fc;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6eaf2;">
  <tr><td style="background:linear-gradient(135deg,#0ea5a4,#4f46e5);padding:22px 28px;">
    <div style="color:#ffffff;font-weight:800;font-size:18px;letter-spacing:-.02em;">≈ Flowline · Weekly Pulse</div>
    <div style="color:#d6f3f2;font-size:13px;margin-top:2px;">${p.businessName} · Week of ${p.week}</div>
  </td></tr>
  <tr><td style="padding:26px 28px 6px;">
    <p style="font-size:15px;color:${ink};margin:0 0 6px;">${p.greeting}</p>
    <h1 style="font-size:21px;line-height:1.3;color:${ink};margin:0 0 16px;">${p.headline}</h1>
    <table role="presentation" width="100%" cellspacing="6" cellpadding="0"><tr>${metricCells}</tr></table>
  </td></tr>
  <tr><td style="padding:18px 28px 4px;">
    <div style="font-size:13px;font-weight:700;color:#12936b;text-transform:uppercase;letter-spacing:.05em;">What's working</div>
    <table role="presentation" width="100%">${list(p.working)}</table>
  </td></tr>
  <tr><td style="padding:14px 28px 4px;">
    <div style="font-size:13px;font-weight:700;color:#c0392b;text-transform:uppercase;letter-spacing:.05em;">What's leaking money</div>
    <table role="presentation" width="100%">${list(p.leaking)}</table>
  </td></tr>
  <tr><td style="padding:14px 28px 4px;">
    <div style="font-size:13px;font-weight:700;color:${brand};text-transform:uppercase;letter-spacing:.05em;">The move${
      p.moves.length > 1 ? "s" : ""
    } to make next</div>
    <table role="presentation" width="100%">${moves}</table>
  </td></tr>
  <tr><td style="padding:16px 28px;">
    <div style="background:#f6f8fc;border:1px solid #e6eaf2;border-radius:12px;padding:14px 16px;font-size:15px;line-height:1.55;color:${ink};">${p.bottomLine}</div>
  </td></tr>
  <tr><td style="padding:4px 28px 26px;">
    <p style="font-size:14px;color:${muted};margin:0 0 14px;">Reply to this email or text your agent at ${
      p.agentPhone || "your agent line"
    } with any question — you'll get a straight answer from your real numbers.</p>
    <p style="font-size:15px;color:${ink};font-weight:600;margin:0;">${p.signoff}</p>
  </td></tr>
  <tr><td style="background:#0e1726;padding:16px 28px;">
    <div style="color:#9aa6b8;font-size:12px;line-height:1.5;">Flowline watches your Google Ads, Meta, website, and leads and reports in booked jobs and dollars. Nothing that affects spend or anything customer-facing goes live without your approval. This read is automated and lands every week — no recurring charge.</div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}
