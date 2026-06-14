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

const CONNECTIONS = [
  {
    key: "googleAds",
    logo: "🔍",
    name: "Google Ads + Local Services",
    desc: "Search campaigns and Google Guaranteed (LSA) — the #1 lead source for trades.",
    fakeId: "123-456-7890",
  },
  {
    key: "meta",
    logo: "📱",
    name: "Meta (Facebook + Instagram)",
    desc: "Lead forms and local awareness across the Meta network.",
    fakeId: "act_99220184",
  },
  {
    key: "website",
    logo: "🌐",
    name: "Your website",
    desc: "Reads your pages + booking flow to find and fix funnel leaks.",
    fakeId: "verified",
  },
  {
    key: "callTracking",
    logo: "📞",
    name: "Call tracking",
    desc: "CallRail / WhatConverts — the source of truth for phone leads.",
    fakeId: "tracked",
  },
  {
    key: "googleBusiness",
    logo: "⭐",
    name: "Google Business Profile",
    desc: "Reviews and local presence — drafts replies, never auto-posts.",
    fakeId: "loc_8841",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    website: "",
    buildWebsite: false,
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

    const wantsSite = form.buildWebsite || !form.website.trim();
    const connections = { ...form.connections };
    if (form.buildWebsite) {
      connections.website = { connected: true, type: "flowline-hosted" };
    }

    const payload = {
      email: form.email.trim(),
      business: {
        name: form.name.trim(),
        website: form.website.trim(),
        phone: form.phone.trim(),
        category: form.category.trim(),
        serviceArea: form.serviceArea.trim(),
        services,
        hostedSite: form.buildWebsite,
        needsWebsite: wantsSite && !form.buildWebsite,
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
      localStorage.setItem("flowline_account_id", data.account.id);
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
              <div className="field">
                <label>Website</label>
                <input
                  className="input"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://yourbusiness.com"
                  disabled={form.buildWebsite}
                  style={form.buildWebsite ? { opacity: 0.5 } : {}}
                />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    marginTop: 10,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.buildWebsite}
                    onChange={(e) => set("buildWebsite", e.target.checked)}
                    style={{ width: 17, height: 17, accentColor: "var(--brand)" }}
                  />
                  <span>
                    I don&apos;t have a website —{" "}
                    <b style={{ color: "var(--brand-ink)" }}>build one for me.</b>{" "}
                    <span className="sub">
                      Flowline generates a hosted site from your info.
                    </span>
                  </span>
                </label>
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
              <h2>Connect your accounts</h2>
              <p className="hint">
                Connect what you have — you can add the rest later. Your agent starts
                read-only and only acts after you approve. (Demo connects instantly;
                live OAuth plugs in here.)
              </p>
              {CONNECTIONS.map((c) => {
                const on = form.connections[c.key]?.connected;
                return (
                  <div className="conn" key={c.key}>
                    <div className="logo">{c.logo}</div>
                    <div className="meta">
                      <b>{c.name}</b>
                      <span>{c.desc}</span>
                    </div>
                    {on ? (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleConn(c.key, c.fakeId)}
                      >
                        <span className="tag connected">● Connected</span>
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => toggleConn(c.key, c.fakeId)}
                      >
                        Connect
                      </button>
                    )}
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
              <ReviewRow label="Website" value={form.website || "—"} />
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
