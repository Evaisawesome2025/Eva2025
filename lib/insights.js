// Deterministic "agent intelligence" for the dashboard.
//
// There is no live ad data in the demo, so we synthesize a coherent picture of
// the business from its profile + a seed derived from the account id. Every
// number is internally consistent (spend -> clicks -> leads -> bookings ->
// revenue) so the funnel, the per-channel table, and the recommendations all
// agree. Swap this module for real Google Ads / Meta / GA4 / call-tracking
// pulls and the rest of the UI is unchanged.

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n) => Math.round(n);
const money = (n) => Math.round(n);

function channel(rng, { name, spendBase, leadCpl, closeRate, jobValue }) {
  const spend = money(spendBase * (0.8 + rng() * 0.5));
  const cpl = leadCpl * (0.75 + rng() * 0.6);
  const leads = Math.max(1, round(spend / cpl));
  const clicks = round(leads * (6 + rng() * 8));
  const close = closeRate * (0.8 + rng() * 0.5);
  const bookings = Math.max(0, round(leads * close));
  const revenue = money(bookings * jobValue * (0.9 + rng() * 0.25));
  const costPerBooking = bookings ? money(spend / bookings) : null;
  return {
    name,
    spend,
    clicks,
    leads,
    bookings,
    revenue,
    costPerLead: money(spend / leads),
    costPerBooking,
    roas: spend ? +(revenue / spend).toFixed(1) : 0,
  };
}

export function buildInsights(account) {
  const id = account?.id || "demo";
  const rng = mulberry32(hashSeed(id));

  const jobValue = Number(account?.economics?.avgJobValue) || 320;
  const closeRate = (Number(account?.economics?.closeRate) || 35) / 100;
  const targetCPB =
    Number(account?.economics?.targetCostPerBooking) ||
    Math.round(jobValue * 0.35);

  const conn = account?.connections || {};
  const channels = [];
  if (conn.googleAds?.connected !== false) {
    channels.push(
      channel(rng, {
        name: "Google Search + LSA",
        spendBase: 1450,
        leadCpl: 28,
        closeRate,
        jobValue,
      })
    );
  }
  if (conn.meta?.connected !== false) {
    channels.push(
      channel(rng, {
        name: "Meta (FB/Instagram)",
        spendBase: 780,
        leadCpl: 19,
        closeRate: closeRate * 0.82,
        jobValue,
      })
    );
  }
  // Organic/GBP always present for a local business.
  channels.push(
    channel(rng, {
      name: "Google Business Profile (organic)",
      spendBase: 0.0001,
      leadCpl: 0.0001,
      closeRate: closeRate * 1.15,
      jobValue,
    })
  );

  const totals = channels.reduce(
    (t, c) => ({
      spend: t.spend + c.spend,
      clicks: t.clicks + c.clicks,
      leads: t.leads + c.leads,
      bookings: t.bookings + c.bookings,
      revenue: t.revenue + c.revenue,
    }),
    { spend: 0, clicks: 0, leads: 0, bookings: 0, revenue: 0 }
  );

  const costPerBooking = totals.bookings
    ? money(totals.spend / totals.bookings)
    : null;
  const roas = totals.spend ? +(totals.revenue / totals.spend).toFixed(1) : 0;

  // Leads inbox — some not yet contacted (speed-to-lead is the headline issue).
  const firstNames = [
    "Maria",
    "James",
    "Priya",
    "Robert",
    "Linda",
    "Chen",
    "Tasha",
    "Owen",
  ];
  const sources = ["Google LSA", "Google Search", "Meta lead form", "GBP call"];
  const leadCount = 5;
  const leads = [];
  for (let i = 0; i < leadCount; i++) {
    const mins = round(rng() * 240);
    const contacted = rng() > 0.45;
    leads.push({
      id: `lead_${i}`,
      name: firstNames[round(rng() * (firstNames.length - 1))],
      source: sources[round(rng() * (sources.length - 1))],
      minutesAgo: mins,
      type: rng() > 0.5 ? "Phone call" : "Form fill",
      contacted,
      value: jobValue,
    });
  }
  leads.sort((a, b) => a.minutesAgo - b.minutesAgo);
  const uncontacted = leads.filter((l) => !l.contacted);

  // Pending approvals — mirror the agent's spend gate + reputation gate.
  const wasteChannel =
    channels.find((c) => c.costPerBooking && c.costPerBooking > targetCPB * 1.4) ||
    channels[0];
  const approvals = [
    {
      id: "appr_spend_1",
      gate: "spend",
      title: `Cut wasted spend on "${wasteChannel.name}"`,
      detail: `Cost per booked job is $${wasteChannel.costPerBooking} vs your $${targetCPB} target. Add 7 negative keywords and lower the daily cap ~18% to redirect ~$${round(
        wasteChannel.spend * 0.18
      )}/wk toward the channels booking jobs cheaply.`,
      impact: `Projected: same bookings, ~$${round(
        wasteChannel.spend * 0.18 * 4
      )}/mo saved.`,
    },
    {
      id: "appr_rep_1",
      gate: "reputation",
      title: "Reply to 2 new Google reviews",
      detail:
        "One 5★ (thank + mention fire-safety), one 3★ about scheduling (apologize, offer to make it right, move off-thread). Drafts are ready — nothing posts until you approve.",
      impact: "Faster review responses lift local ranking + conversion.",
    },
    {
      id: "appr_spend_2",
      gate: "spend",
      title: "Shift $200/wk into the top-booking channel",
      detail: `${channels[0].name} is booking jobs at $${
        channels[0].costPerBooking || targetCPB
      } — under target. Raise its daily budget to capture more demand before peak season.`,
      impact: "Projected: +3–5 booked jobs/mo at target cost.",
    },
  ];

  // Prioritized action list (the "weekly review"), tagged like CLAUDE.md.
  const actions = [
    {
      tag: uncontacted.length ? "APPROVE" : "AUTO-OK",
      text: uncontacted.length
        ? `${uncontacted.length} lead(s) never got called back — draft + send a 60-second follow-up text now.`
        : "All leads contacted within target. Speed-to-lead is healthy.",
    },
    {
      tag: "AUTO-OK",
      text: "Pulled 7/28-day performance across every connected surface and rebuilt the funnel.",
    },
    {
      tag: "APPROVE",
      text: `Reallocate budget away from "${wasteChannel.name}" toward the channels booking jobs under $${targetCPB}.`,
    },
    {
      tag: "AUTO-OK",
      text: "Refreshed 1 fatigued Meta creative (CTR down 22% over 14 days) — draft ready in Website/Creative.",
    },
    { tag: "APPROVE", text: "2 review replies drafted and waiting in your inbox." },
  ];

  return {
    generatedAt: new Date().toISOString(),
    window: "Last 28 days",
    totals: { ...totals, costPerBooking, roas, targetCostPerBooking: targetCPB },
    channels,
    leads,
    uncontactedCount: uncontacted.length,
    approvals,
    actions,
    health: {
      onTarget: costPerBooking !== null && costPerBooking <= targetCPB,
      costPerBooking,
      targetCostPerBooking: targetCPB,
    },
  };
}
