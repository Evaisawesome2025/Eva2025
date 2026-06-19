"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { buildPulse } from "../../../lib/pulse.js";

// The Weekly Pulse as it lands in the owner's inbox — rendered inside a mock
// email reader so it reads like the real thing, not a dashboard tab.
export default function PulsePage() {
  const params = useParams();
  const id = params?.id;
  const [pulse, setPulse] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Browser copy is authoritative (works on hosts without persistence).
    try {
      const raw = localStorage.getItem("flowline_account");
      if (raw) {
        const acc = JSON.parse(raw);
        setPulse(buildPulse(acc));
        setStatus("ready");
        return;
      }
    } catch {}
    // Fallback: pull the structured pulse from the server by id.
    fetch(`/api/pulse?id=${id}&format=json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setPulse(d.pulse);
        setStatus("ready");
      })
      .catch(() => setStatus("missing"));
  }, [id]);

  if (status === "loading")
    return <Frame><p style={{ color: "#7a6a55" }}>Loading your weekly pulse…</p></Frame>;

  if (status === "missing")
    return (
      <Frame>
        <p style={{ color: "#7a6a55" }}>
          We couldn&apos;t find this pulse in your browser.{" "}
          <Link href="/dashboard" style={{ color: "#7a5230", fontWeight: 700 }}>
            Open your dashboard
          </Link>{" "}
          first, then come back.
        </p>
      </Frame>
    );

  const chipLinks = [
    { label: "Looks good, thanks.", q: "Thanks — the pulse looks good." },
    { label: "What should I do first?", q: "What should I do first this week?" },
    { label: "Show me the leads.", q: "Any leads we didn't call back?" },
  ];

  return (
    <Frame>
      <div style={styles.emailCard}>
        {/* Email header row */}
        <div style={styles.subjectRow}>
          <h1 style={styles.subject}>{pulse.subject}</h1>
        </div>
        <div style={styles.fromRow}>
          <div style={styles.avatar}>≈</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#3f3326", fontSize: 14 }}>
              Flowline Agent <span style={{ color: "#9a8a72", fontWeight: 400 }}>&lt;pulse@flowline.app&gt;</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#9a8a72" }}>
              to you · Week of {pulse.week}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={styles.body}>
          <p style={styles.greeting}>{pulse.greeting}</p>
          <h2 style={styles.headline}>{pulse.headline}</h2>

          <div style={styles.metricGrid}>
            {pulse.metrics.map((m) => (
              <div key={m.label} style={styles.metric}>
                <div style={styles.metricLabel}>{m.label}</div>
                <div
                  style={{
                    ...styles.metricValue,
                    color: m.good ? "#1f7a4d" : "#3f3326",
                  }}
                >
                  {m.value}
                </div>
                {m.note && <div style={styles.metricNote}>{m.note}</div>}
              </div>
            ))}
          </div>

          <Section title="What's working" color="#1f7a4d" items={pulse.working} />
          <Section title="What's leaking money" color="#b23b2e" items={pulse.leaking} />

          <div style={{ marginTop: 18 }}>
            <div style={{ ...styles.sectionTitle, color: "#7a5230" }}>
              The move{pulse.moves.length > 1 ? "s" : ""} to make next
            </div>
            {pulse.moves.map((m, i) => (
              <div key={i} style={styles.move}>
                <div style={styles.moveLabel}>
                  {i + 1}. {m.label}
                  <span
                    style={{
                      ...styles.gateChip,
                      color: m.gate === "spend" ? "#4f46e5" : "#b23b2e",
                      background: m.gate === "spend" ? "#eef1fb" : "#fbe9e7",
                    }}
                  >
                    {m.gate === "spend" ? "$ needs your OK" : "★ needs your OK"}
                  </span>
                </div>
                <div style={styles.moveDetail}>{m.detail}</div>
              </div>
            ))}
          </div>

          <div style={styles.bottomLine}>{pulse.bottomLine}</div>

          <p style={styles.replyNote}>
            Reply to this email or text your agent
            {pulse.agentPhone ? ` at ${pulse.agentPhone}` : ""} with any question —
            you&apos;ll get a straight answer from your real numbers.
          </p>
          <p style={styles.signoff}>{pulse.signoff}</p>
        </div>

        {/* Quick-reply chips — deep-link into the agent chat, like the inbox */}
        <div style={styles.chipRow}>
          {chipLinks.map((c) => (
            <Link
              key={c.label}
              href={`/dashboard?ask=${encodeURIComponent(c.q)}`}
              style={styles.chip}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div style={styles.actionRow}>
          <Link href={`/dashboard?ask=${encodeURIComponent("Reply to my agent")}`} style={styles.actionBtn}>
            ↩ Reply
          </Link>
          <a href={`/api/pulse?id=${id}`} target="_blank" rel="noreferrer" style={styles.actionBtn}>
            ✉ View as email
          </a>
          <Link href="/dashboard" style={styles.actionBtnGhost}>
            Open dashboard
          </Link>
        </div>
      </div>

      <p style={styles.footnote}>
        This read is automated and lands in your inbox every week — no recurring
        charge. <Link href="/dashboard" style={{ color: "#7a5230", fontWeight: 700 }}>Back to dashboard</Link>
      </p>
    </Frame>
  );
}

function Section({ title, color, items }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ ...styles.sectionTitle, color }}>{title}</div>
      <ul style={styles.list}>
        {items.map((x, i) => (
          <li key={i} style={styles.listItem}>
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Frame({ children }) {
  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <Link href="/" style={styles.brand}>
          <span style={styles.brandMark}>≈</span> Flowline
        </Link>
        <span style={{ fontSize: 13, color: "#9a8a72" }}>Inbox · Weekly Pulse</span>
      </div>
      <div style={styles.container}>{children}</div>
    </div>
  );
}

// Warm "inbox" aesthetic matching the reference screenshots, kept inline so the
// page is self-contained and doesn't lean on the app's blue dashboard theme.
const styles = {
  page: { minHeight: "100vh", background: "#f3ece1", paddingBottom: 40 },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    maxWidth: 680,
    margin: "0 auto",
  },
  brand: { display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: 18, color: "#3f3326" },
  brandMark: {
    width: 28, height: 28, borderRadius: 8,
    background: "linear-gradient(135deg,#0ea5a4,#4f46e5)",
    display: "grid", placeItems: "center", color: "#fff", fontSize: 16,
  },
  container: { maxWidth: 680, margin: "0 auto", padding: "0 16px" },
  emailCard: {
    background: "#fbf6ee",
    border: "1px solid #e6d9c5",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(80,60,30,0.08)",
  },
  subjectRow: { padding: "20px 24px 6px" },
  subject: { fontSize: 19, lineHeight: 1.35, color: "#3f3326", margin: 0, fontWeight: 800 },
  fromRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "8px 24px 16px", borderBottom: "1px solid #efe4d2",
  },
  avatar: {
    width: 38, height: 38, borderRadius: "50%",
    background: "linear-gradient(135deg,#0ea5a4,#4f46e5)",
    display: "grid", placeItems: "center", color: "#fff", fontSize: 18, fontWeight: 700,
  },
  body: { padding: "18px 24px 4px" },
  greeting: { fontSize: 15, color: "#3f3326", margin: "0 0 6px" },
  headline: { fontSize: 20, lineHeight: 1.3, color: "#3f3326", margin: "0 0 16px" },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(96px,1fr))",
    gap: 8,
    marginBottom: 6,
  },
  metric: {
    border: "1px solid #e6d9c5", borderRadius: 10, padding: "9px 11px", background: "#fffdf9",
  },
  metricLabel: { fontSize: 11, color: "#9a8a72", textTransform: "uppercase", letterSpacing: ".04em" },
  metricValue: { fontSize: 19, fontWeight: 800, marginTop: 3 },
  metricNote: { fontSize: 11.5, color: "#9a8a72", marginTop: 2 },
  sectionTitle: { fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em" },
  list: { margin: "6px 0 0", paddingLeft: 18 },
  listItem: { fontSize: 14.5, lineHeight: 1.55, color: "#4a3d2d", marginBottom: 6 },
  move: { padding: "10px 0", borderTop: "1px solid #efe4d2" },
  moveLabel: { fontSize: 15, fontWeight: 700, color: "#3f3326" },
  gateChip: {
    fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, marginLeft: 6,
    whiteSpace: "nowrap",
  },
  moveDetail: { fontSize: 14, lineHeight: 1.55, color: "#7a6a55", marginTop: 4 },
  bottomLine: {
    background: "#f3ead9", border: "1px solid #e6d9c5", borderRadius: 12,
    padding: "13px 15px", fontSize: 15, lineHeight: 1.55, color: "#3f3326", marginTop: 18,
  },
  replyNote: { fontSize: 13.5, color: "#9a8a72", margin: "16px 0 12px", lineHeight: 1.5 },
  signoff: { fontSize: 15, color: "#3f3326", fontWeight: 700, margin: "0 0 18px" },
  chipRow: { display: "flex", gap: 10, flexWrap: "wrap", padding: "0 24px 16px" },
  chip: {
    border: "1px solid #cdaa7a", color: "#7a5230", borderRadius: 14,
    padding: "10px 16px", fontSize: 14, fontWeight: 600, background: "#fffdf9",
  },
  actionRow: {
    display: "flex", gap: 10, flexWrap: "wrap",
    padding: "14px 24px 20px", borderTop: "1px solid #efe4d2",
  },
  actionBtn: {
    background: "#7a5230", color: "#fff", borderRadius: 22,
    padding: "11px 22px", fontSize: 14.5, fontWeight: 600,
  },
  actionBtnGhost: {
    border: "1px solid #cdaa7a", color: "#7a5230", borderRadius: 22,
    padding: "11px 22px", fontSize: 14.5, fontWeight: 600,
  },
  footnote: { textAlign: "center", fontSize: 13, color: "#9a8a72", marginTop: 18 },
};
