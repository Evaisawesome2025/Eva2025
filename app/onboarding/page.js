"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SERVICE_SUGGESTIONS = [
  "Dryer vent cleaning",
  "Air duct cleaning",
  "Vent guard installs",
  "Recurring maintenance plans",
  "Chimney sweeping",
  "Commercial / property managers",
];

const STEPS = ["Business", "Services", "Economics", "Connect", "Review"];

// The three accounts that matter most — one click each.
const PRIMARY_CONNECTIONS = [
  {
    key: "googleAds",
    logo: "🔍",
    name: "Google Ads",
    desc: "Search + Local Services (Google Guaranteed) — the #1 lead source for local trades.",
    fakeId: "123-456-7890",
  },
  {
    key: "searchConsole",
    logo: "📊",
    name: "Google Search Console",
    desc: "See the searches finding you and where your site ranks — feeds your website's SEO.",
    fakeId: "sc-domain:verified",
  },
  {
    key: "meta",
    logo: "📱",
    name: "Meta Ads",
    desc: "Facebook + Instagram lead forms and local awareness.",
    fakeId: "act_99220184",
  },
];

// Nice-to-have extras, shown smaller.
const SECONDARY_CONNECTIONS = [
  {
    key: "callTracking",
    logo: "📞",
    name: "Call tracking",
    desc: "CallRail / WhatConverts — source of truth for phone leads.",
    fakeId: "tracked",
  },
  {
    key: "googleBusiness",
    logo: "⭐",
    name: "Google Business Profile",
    desc: "Reviews + local presence. Drafts replies, never auto-posts.",
    fakeId: "loc_8841",
  },
];

const CONNECTIONS = [...PRIMARY_CONNECTIONS, ...SECONDARY_CONNECTIONS];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    website: "",
    buildWebsite: true,
    phone: "",
    email: "",
    category: "",
    serviceArea: "",
    services: [],
    customService: "",
    avgJobValue: "",
    closeRate: "",
    targetCostPerBooking: "",
    monthlyBudget: "",
    connections: {},
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleService = (s) =>
    setForm((f) => ({
      ...f,
      services: f.services.includes(s)
        ? f.services.filter((x) => x !== s)
        : [...f.services, s],
    }));

  const toggleConn = (key, fakeId) =>
    setForm((f) => ({
      ...f,
      connections: {
        ...f.connections,
        [key]: f.connections[key]?.connected
          ? { connected: false }
          : { connected: true, accountId: fakeId },
      },
    }));

  const prefillFreshFlow = () =>
    setForm((f) => ({
      ...f,
      name: "FreshFlow Dryer Vent Cleaning",
      website: "https://freshflowvents.com",
      phone: "(555) 374-8200",
      email: f.email || "",
      category: "Dryer Vent Cleaning",
      serviceArea: "Greater metro area, 25-mile radius",
      services: [
        "Dryer vent cleaning",
        "Air duct cleaning",
        "Vent guard installs",
        "Recurring maintenance plans",
      ],
      avgJobValue: "320",
      closeRate: "35",
      targetCostPerBooking: "110",
      monthlyBudget: "3000",
    }));

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.phone.trim();
    return true;
  };

  const next = () => {
    setError("");
    if (step < STEPS.length - 1) setStep(step + 1);
  };
  const back = () => setStep(Math.max(0, step - 1));

  async function submit() {
    setSaving(true);
    setError("");
    const services = [...form.services];
    if (form.customService.trim()) services.push(form.customService.trim());

    // Flowline always builds and hosts the website (ad-synced).
    const connections = {
      ...form.connections,
      website: { connected: true, type: "flowline-hosted" },
    };

    const payload = {
      email: form.email.trim(),
      business: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        category: form.category.trim(),
        serviceArea: form.serviceArea.trim(),
        services,
        hostedSite: true,
        needsWebsite: false,
      },
      economics: {
        avgJobValue: form.avgJobValue,
        closeRate: form.closeRate,
        targetCostPerBooking: form.targetCostPerBooking,
        monthlyBudget: form.monthlyBudget,
      },
      connections,
      preferences: {
        requireApprovalForSpend: true,
        requireApprovalForCustomerFacing: true,
      },
    };

    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not save your business.");
      // Save the full account in the browser so the dashboard + hosted site work
      // on any host, including serverless with no persistent storage.
      localStorage.setItem("flowline_account_id", data.account.id);
      localStorage.setItem("flowline_account", JSON.stringify(data.account));
      router.push("/dashboard");
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">≈</span> Flowline
        </Link>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </span>
      </nav>

      <div className="onboard">
        <div className="progress">
          {STEPS.map((s, i) => (
            <div key={s} className={"seg" + (i <= step ? " on" : "")} />
          ))}
        </div>

        <div className="stepcard">
          {step === 0 && (
            <>
              <h2>Tell us about your business</h2>
              <p className="hint">
                This is what your agent represents.{" "}
                <a
                  onClick={prefillFreshFlow}
                  style={{ color: "var(--brand-ink)", cursor: "pointer", fontWeight: 600 }}
                >
                  Prefill the FreshFlow example
                </a>
              </p>
              <div className="field">
                <label>Business name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="FreshFlow Dryer Vent Cleaning"
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  background: "#e6f6f5",
                  border: "1px solid #bfe8e6",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 22 }}>🌐</span>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                  <b>We build your website for you.</b>{" "}
                  <span style={{ color: "var(--muted)" }}>
                    No need to connect an old site — Flowline generates a fast, hosted
                    site from your info that&apos;s wired to your Google Ads and Meta
                    (conversion tracking, click-to-call, and lead forms all sync
                    automatically).
                  </span>
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>
                    Agent phone number *{" "}
                    <span className="sub">— the number you'll text to chat with it</span>
                  </label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="(555) 374-8200"
                  />
                </div>
              </div>
              <div className="field">
                <label>
                  Your email <span className="sub">— so you can sign back in</span>
                </label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@business.com"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2>What do you offer?</h2>
              <p className="hint">
                Your agent uses this to write ads and pages, and to know which leads
                are worth chasing hardest.
              </p>
              <div className="field">
                <label>Primary category</label>
                <input
                  className="input"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="Dryer Vent Cleaning"
                />
              </div>
              <div className="field">
                <label>Services you provide</label>
                <div className="chips">
                  {SERVICE_SUGGESTIONS.map((s) => (
                    <span
                      key={s}
                      className={"chip" + (form.services.includes(s) ? " on" : "")}
                      onClick={() => toggleService(s)}
                    >
                      {form.services.includes(s) ? "✓ " : ""}
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>
                  Anything else? <span className="sub">— add your own</span>
                </label>
                <input
                  className="input"
                  value={form.customService}
                  onChange={(e) => set("customService", e.target.value)}
                  placeholder="e.g. emergency same-day service"
                />
              </div>
              <div className="field">
                <label>Service area</label>
                <input
                  className="input"
                  value={form.serviceArea}
                  onChange={(e) => set("serviceArea", e.target.value)}
                  placeholder="Greater metro area, 25-mile radius"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>The economics that drive every decision</h2>
              <p className="hint">
                Optional but powerful. These let your agent judge ad spend in booked
                jobs and dollars instead of clicks. You can change them anytime.
              </p>
              <div className="row">
                <div className="field">
                  <label>Average job value ($)</label>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={form.avgJobValue}
                    onChange={(e) => set("avgJobValue", e.target.value)}
                    placeholder="320"
                  />
                </div>
                <div className="field">
                  <label>Lead → booking close rate (%)</label>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={form.closeRate}
                    onChange={(e) => set("closeRate", e.target.value)}
                    placeholder="35"
                  />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>Target cost per booked job ($)</label>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={form.targetCostPerBooking}
                    onChange={(e) => set("targetCostPerBooking", e.target.value)}
                    placeholder="110"
                  />
                </div>
                <div className="field">
                  <label>Monthly ad budget ($)</label>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={form.monthlyBudget}
                    onChange={(e) => set("monthlyBudget", e.target.value)}
                    placeholder="3000"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Connect your ad accounts</h2>
              <p className="hint">
                One click each. Your agent starts read-only and never spends without
                your approval. You can add or skip any of these now.
              </p>

              {PRIMARY_CONNECTIONS.map((c) => {
                const on = form.connections[c.key]?.connected;
                return (
                  <div
                    className="conn"
                    key={c.key}
                    style={
                      on
                        ? { borderColor: "var(--brand)", background: "#f0fbfa" }
                        : {}
                    }
                  >
                    <div className="logo" style={{ width: 46, height: 46, fontSize: 24 }}>
                      {c.logo}
                    </div>
                    <div className="meta">
                      <b>{c.name}</b>
                      <span>{c.desc}</span>
                    </div>
                    <button
                      className={on ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm"}
                      onClick={() => toggleConn(c.key, c.fakeId)}
                    >
                      {on ? (
                        <span className="tag connected">● Connected</span>
                      ) : (
                        "Connect"
                      )}
                    </button>
                  </div>
                );
              })}

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  background: "#e6f6f5",
                  border: "1px solid #bfe8e6",
                  borderRadius: 12,
                  padding: "14px 16px",
                  margin: "6px 0 18px",
                }}
              >
                <span style={{ fontSize: 22 }}>🌐</span>
                <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                  <b>Your website is included.</b>{" "}
                  <span style={{ color: "var(--muted)" }}>
                    We build and host it for you, pre-wired so Google Ads and Meta
                    conversions, click-to-call, and lead forms sync automatically.
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  margin: "4px 0 10px",
                }}
              >
                Optional extras
              </div>
              {SECONDARY_CONNECTIONS.map((c) => {
                const on = form.connections[c.key]?.connected;
                return (
                  <div className="conn" key={c.key}>
                    <div className="logo">{c.logo}</div>
                    <div className="meta">
                      <b>{c.name}</b>
                      <span>{c.desc}</span>
                    </div>
                    <button
                      className={on ? "btn btn-ghost btn-sm" : "btn btn-ghost btn-sm"}
                      onClick={() => toggleConn(c.key, c.fakeId)}
                    >
                      {on ? (
                        <span className="tag connected">● Connected</span>
                      ) : (
                        "Connect"
                      )}
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {step === 4 && (
            <>
              <h2>Ready to meet your agent</h2>
              <p className="hint">
                Here's what {form.name || "your business"} looks like. Create the
                account and your dashboard goes live.
              </p>
              <ReviewRow label="Business" value={form.name} />
              <ReviewRow label="Website" value="Flowline builds & hosts it (ad-synced)" />
              <ReviewRow label="Agent phone" value={form.phone} />
              <ReviewRow
                label="Services"
                value={
                  [
                    ...form.services,
                    form.customService.trim() ? form.customService.trim() : null,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"
                }
              />
              <ReviewRow label="Service area" value={form.serviceArea || "—"} />
              <ReviewRow
                label="Avg job / target CPB"
                value={`$${form.avgJobValue || "—"} / $${
                  form.targetCostPerBooking || "—"
                }`}
              />
              <ReviewRow
                label="Connected"
                value={
                  CONNECTIONS.filter((c) => form.connections[c.key]?.connected)
                    .map((c) => c.name)
                    .join(", ") || "None yet"
                }
              />
              <div className="banner good" style={{ marginTop: 18, marginBottom: 0 }}>
                🔒 Spend gate &amp; reputation gate are on. Your agent drafts; you
                approve.
              </div>
            </>
          )}

          {error && (
            <div className="banner warn" style={{ marginTop: 16, marginBottom: 0 }}>
              {error}
            </div>
          )}

          <div className="actions">
            {step > 0 ? (
              <button className="btn btn-ghost" onClick={back} disabled={saving}>
                ← Back
              </button>
            ) : (
              <Link className="btn btn-ghost" href="/">
                Cancel
              </Link>
            )}
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" onClick={next} disabled={!canNext()}>
                Continue →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? "Creating…" : "Create my account →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "10px 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <span style={{ color: "var(--muted)", fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 14, textAlign: "right" }}>
        {value || "—"}
      </span>
    </div>
  );
}
