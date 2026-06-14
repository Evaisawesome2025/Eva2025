"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buildInsights } from "../../lib/insights.js";

const money = (n) => (n == null ? "—" : "$" + Number(n).toLocaleString());

export default function Dashboard() {
  const [account, setAccount] = useState(null);
  const [insights, setInsights] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | signin | ready | error
  const [emailInput, setEmailInput] = useState("");
  const [signinErr, setSigninErr] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Primary source of truth is the account saved in the browser — works on
    // any host, including serverless with no persistent filesystem.
    try {
      const raw = localStorage.getItem("flowline_account");
      if (raw) {
        useAccount(JSON.parse(raw));
        return;
      }
    } catch {}
    const id = localStorage.getItem("flowline_account_id");
    if (id) {
      loadFromServer(id);
      return;
    }
    setStatus("signin");
  }, []);

  function useAccount(acc) {
    setAccount(acc);
    setInsights(buildInsights(acc));
    setStatus("ready");
  }

  // Fallback path: fetch from the server by id (used when no browser copy exists).
  async function loadFromServer(id) {
    try {
      const acc = await fetch(`/api/account?id=${id}`).then((r) => r.json());
      if (acc.error) {
        setStatus("signin");
        return;
      }
      try {
        localStorage.setItem("flowline_account", JSON.stringify(acc.account));
      } catch {}
      useAccount(acc.account);
    } catch {
      setStatus("error");
    }
  }

  async function signin(e) {
    e.preventDefault();
    setSigninErr("");
    try {
      const res = await fetch(`/api/account?email=${encodeURIComponent(emailInput)}`);
      if (!res.ok) {
        setSigninErr("No account found for that email on this server. If you set it up in this browser, just reopen the dashboard; otherwise set one up.");
        return;
      }
      const data = await res.json();
      localStorage.setItem("flowline_account_id", data.account.id);
      localStorage.setItem("flowline_account", JSON.stringify(data.account));
      useAccount(data.account);
    } catch {
      setSigninErr("Couldn't reach the server. Try setting up your business.");
    }
  }

  if (status === "loading")
    return <Centered>Loading your dashboard…</Centered>;

  if (status === "error")
    return <Centered>Something went wrong. Refresh to try again.</Centered>;

  if (status === "signin")
    return (
      <div className="shell">
        <TopNav />
        <div className="center-narrow">
          <h2 style={{ marginBottom: 6 }}>Sign in</h2>
          <p style={{ color: "var(--muted)", marginTop: 0 }}>
            Enter the email you used to set up your business.
          </p>
          <form onSubmit={signin}>
            <input
              className="input"
              type="email"
              required
              placeholder="you@business.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <button className="btn btn-primary" style={{ width: "100%" }}>
              Open my dashboard
            </button>
          </form>
          {signinErr && (
            <div className="banner warn" style={{ marginTop: 14 }}>
              {signinErr}
            </div>
          )}
          <p style={{ marginTop: 20, color: "var(--muted)", fontSize: 14 }}>
            New here?{" "}
            <Link href="/onboarding" style={{ color: "var(--brand-ink)", fontWeight: 600 }}>
              Set up your business →
            </Link>
          </p>
        </div>
      </div>
    );

  const t = insights.totals;
  const onTarget = insights.health.onTarget;
  const biz = account.business;

  return (
    <div className="shell">
      <TopNav account={account} />
      <div className="dash">
        <div className="dash-head">
          <div>
            <h1>{biz.name}</h1>
            <div className="sub">
              {biz.category || "Local service business"} ·{" "}
              {biz.serviceArea || "Your area"} · Agent line {biz.phone}
            </div>
          </div>
          <Link className="btn btn-ghost btn-sm" href="/onboarding">
            + Add / edit connections
          </Link>
        </div>

        <div className={"banner " + (onTarget ? "good" : "warn")}>
          {onTarget ? "✅" : "⚠️"}
          <span>
            {insights.window}: you booked <b>{t.bookings} jobs</b> at{" "}
            <b>{money(t.costPerBooking)}</b> each
            {" "}
            (target {money(t.targetCostPerBooking)}).
            {insights.uncontactedCount > 0 &&
              ` ${insights.uncontactedCount} lead(s) still need a callback — fix that first.`}
          </span>
        </div>

        <div className="kpis">
          <Kpi label="Ad spend" val={money(t.spend)} note={insights.window} />
          <Kpi label="Leads" val={t.leads} note={`${t.clicks} clicks`} />
          <Kpi label="Booked jobs" val={t.bookings} note="on the calendar" />
          <Kpi
            label="Cost / booked job"
            val={money(t.costPerBooking)}
            note={onTarget ? "under target ✓" : "over target"}
            good={onTarget}
          />
          <Kpi label="Revenue" val={money(t.revenue)} note={`${t.roas}x ROAS`} />
        </div>

        <div className="dash-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Panel title="The funnel, by channel">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Spend</th>
                    <th>Leads</th>
                    <th>Booked</th>
                    <th>Cost / job</th>
                    <th>ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.channels.map((c) => (
                    <tr key={c.name}>
                      <td>{c.name}</td>
                      <td style={{ textAlign: "right" }}>{money(c.spend)}</td>
                      <td style={{ textAlign: "right" }}>{c.leads}</td>
                      <td style={{ textAlign: "right" }}>{c.bookings}</td>
                      <td
                        style={{
                          textAlign: "right",
                          color:
                            c.costPerBooking &&
                            c.costPerBooking > t.targetCostPerBooking
                              ? "var(--danger)"
                              : "var(--good)",
                          fontWeight: 600,
                        }}
                      >
                        {money(c.costPerBooking)}
                      </td>
                      <td style={{ textAlign: "right" }}>{c.roas}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel
              title="Needs your approval"
              right={<span className="gatetag">Spend &amp; reputation gates on</span>}
            >
              {insights.approvals.map((a) => (
                <div className="appr" key={a.id}>
                  <span
                    className="gatetag"
                    style={{
                      background: a.gate === "spend" ? "#eef1fb" : "#fdeef0",
                      color: a.gate === "spend" ? "var(--brand-2)" : "var(--danger)",
                    }}
                  >
                    {a.gate === "spend" ? "$ spend" : "★ reputation"}
                  </span>
                  <div className="body">
                    <b>{a.title}</b>
                    <p>{a.detail}</p>
                    <span className="impact">{a.impact}</span>
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <ApprovalButtons />
                    </div>
                  </div>
                </div>
              ))}
            </Panel>

            <Panel title="This week's action list">
              {insights.actions.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    padding: "9px 0",
                    borderBottom:
                      i < insights.actions.length - 1
                        ? "1px solid #f1f4f9"
                        : "none",
                  }}
                >
                  <span className={"pill " + (a.tag === "AUTO-OK" ? "auto" : "approve")}>
                    {a.tag}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: 1.5 }}>{a.text}</span>
                </div>
              ))}
            </Panel>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <ChatPanel account={account} insights={insights} />

            <WebsitePanel account={account} onUpdate={setAccount} />

            <Panel title="Leads inbox" right={<span style={{ fontSize: 12.5, color: "var(--muted)" }}>speed-to-lead wins jobs</span>}>
              {insights.leads.map((l) => (
                <div className="lead-row" key={l.id}>
                  <span className={"dot " + (l.contacted ? "green" : "red")} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {l.name}{" "}
                      <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                        · {l.type}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                      {l.source} · {l.minutesAgo} min ago · ~{money(l.value)}
                    </div>
                  </div>
                  <span
                    className={"tag " + (l.contacted ? "connected" : "")}
                    style={
                      l.contacted
                        ? {}
                        : { color: "var(--danger)", background: "#fdeef0" }
                    }
                  >
                    {l.contacted ? "Contacted" : "No callback"}
                  </span>
                </div>
              ))}
            </Panel>

            <Panel title="Connected accounts">
              <ConnList connections={account.connections} />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebsitePanel({ account, onUpdate }) {
  const [building, setBuilding] = useState(false);
  const biz = account.business || {};
  const siteUrl = `/site/${account.id}`;
  const hosted = biz.hostedSite;
  const external = !hosted && biz.website;

  async function build() {
    setBuilding(true);
    const updated = {
      ...account,
      business: { ...biz, hostedSite: true, needsWebsite: false },
      connections: {
        ...account.connections,
        website: { connected: true, type: "flowline-hosted" },
      },
    };
    // Persist to the server best-effort, but the browser copy is authoritative
    // so the site renders even on hosts without persistence.
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        Object.assign(updated, data.account);
      }
    } catch {}
    try {
      localStorage.setItem("flowline_account", JSON.stringify(updated));
    } catch {}
    onUpdate(updated);
    setBuilding(false);
  }

  return (
    <Panel
      title="Your website"
      right={
        hosted ? (
          <span className="tag connected">● Live</span>
        ) : external ? (
          <span className="tag connected">● Connected</span>
        ) : (
          <span className="tag pending">Not set up</span>
        )
      }
    >
      {hosted ? (
        <>
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 12,
              overflow: "hidden",
              height: 220,
              marginBottom: 12,
              background: "#fff",
            }}
          >
            <iframe
              src={siteUrl}
              title="Your website preview"
              style={{
                width: "200%",
                height: "440px",
                border: "none",
                transform: "scale(0.5)",
                transformOrigin: "top left",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a className="btn btn-primary btn-sm" href={siteUrl} target="_blank" rel="noreferrer">
              Open live site →
            </a>
            <a className="btn btn-ghost btn-sm" href={siteUrl} target="_blank" rel="noreferrer">
              Edit content
            </a>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10, marginBottom: 0 }}>
            Built &amp; hosted by Flowline from your business info. Your agent keeps the
            copy, services, and calls-to-action in sync.
          </p>
        </>
      ) : external ? (
        <>
          <p style={{ fontSize: 14, margin: "0 0 12px", color: "var(--muted)" }}>
            Connected to <b style={{ color: "var(--ink)" }}>{biz.website}</b>. Your agent
            reads the funnel and drafts page improvements for your approval.
          </p>
          <button className="btn btn-ghost btn-sm" onClick={build} disabled={building}>
            {building ? "Building…" : "Build a Flowline landing page too"}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 14, margin: "0 0 12px", color: "var(--muted)" }}>
            You don&apos;t have a website connected. Flowline can build and host one for
            you in seconds, generated from your services and service area.
          </p>
          <button className="btn btn-primary btn-sm" onClick={build} disabled={building}>
            {building ? "Building your website…" : "🌐 Build my website"}
          </button>
        </>
      )}
    </Panel>
  );
}

function ApprovalButtons() {
  const [state, setState] = useState("");
  if (state === "approved")
    return <span className="tag connected">✓ Approved — agent will execute</span>;
  if (state === "dismissed")
    return <span className="tag pending">Dismissed</span>;
  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setState("approved")}>
        Approve
      </button>
      <button className="btn btn-ghost btn-sm" onClick={() => setState("dismissed")}>
        Not now
      </button>
    </>
  );
}

function ConnList({ connections = {} }) {
  const map = [
    { key: "googleAds", logo: "🔍", name: "Google Ads + LSA" },
    { key: "meta", logo: "📱", name: "Meta Ads" },
    { key: "website", logo: "🌐", name: "Website" },
    { key: "callTracking", logo: "📞", name: "Call tracking" },
    { key: "googleBusiness", logo: "⭐", name: "Google Business Profile" },
  ];
  return (
    <>
      {map.map((m) => {
        const on = connections[m.key]?.connected;
        return (
          <div className="lead-row" key={m.key}>
            <div className="logo" style={{ width: 32, height: 32, fontSize: 16 }}>
              {m.logo}
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{m.name}</div>
            <span className={"tag " + (on ? "connected" : "pending")}>
              {on ? "● Connected" : "Not connected"}
            </span>
          </div>
        );
      })}
    </>
  );
}

function ChatPanel({ account, insights }) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: `Hi — I'm your Flowline agent for ${account.business.name}. Ask me anything about your ads, leads, or numbers. I'll never spend money or message a customer without your approval.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);

  const suggestions = [
    "How did we do this month?",
    "Any leads we didn't call back?",
    "Where am I wasting ad spend?",
    "Draft replies to my reviews",
  ];

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, busy]);

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setBusy(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: account.id, account, message: msg }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "bot", text: data.reply || "…" }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "I couldn't reach the server just now — try again." },
      ]);
    }
    setBusy(false);
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>💬 Chat with your agent</h3>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
          texts {account.business.phone}
        </span>
      </div>
      <div className="chat">
        <div className="chat-log" ref={logRef}>
          {messages.map((m, i) => (
            <div key={i} className={"msg " + m.role}>
              {m.text}
            </div>
          ))}
          {busy && <div className="msg bot">…</div>}
        </div>
        <div className="suggest">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
        <div className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about performance, leads, spend…"
          />
          <button className="btn btn-primary btn-sm" onClick={() => send()} disabled={busy}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, val, note, good }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="val">{val}</div>
      <div
        className="delta"
        style={{ color: good ? "var(--good)" : "var(--muted)" }}
      >
        {note}
      </div>
    </div>
  );
}

function Panel({ title, right, children }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        {right}
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

function TopNav({ account }) {
  return (
    <nav className="app-nav">
      <div className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">≈</span> Flowline
        </Link>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {account && (
            <span style={{ fontSize: 14, color: "var(--muted)" }}>
              {account.business.name}
            </span>
          )}
          <Link className="btn btn-ghost btn-sm" href="/">
            Home
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Centered({ children }) {
  return (
    <div className="shell">
      <TopNav />
      <div className="center-narrow">{children}</div>
    </div>
  );
}
