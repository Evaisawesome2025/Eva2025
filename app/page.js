import Link from "next/link";

const features = [
  {
    icon: "📈",
    title: "Runs your ads, both platforms",
    body: "Connect Google Ads (Search + Local Services) and Meta. Flowline watches spend, finds wasted budget, refreshes tired creative, and shifts money toward whatever is booking jobs cheapest.",
  },
  {
    icon: "🌐",
    title: "Builds and runs your website",
    body: "No website? Flowline generates and hosts a professional one from your services in seconds. Already have one? It reads your funnel and drafts page changes that turn more visitors into booked jobs.",
  },
  {
    icon: "📞",
    title: "Never lets a lead go cold",
    body: "Every call and form fill is tracked. If a lead wasn't called back fast, Flowline drafts the follow-up text in seconds — because speed-to-lead wins the job.",
  },
  {
    icon: "⭐",
    title: "Protects your reputation",
    body: "Drafts replies to every Google review, keeps your Business Profile sharp, and flags reputation risks — nothing posts publicly without your OK.",
  },
  {
    icon: "🧮",
    title: "Thinks in dollars, not clicks",
    body: "One honest number leads every report: cost per booked job vs. your profit per job. No vanity metrics, no dashboards you have to decode.",
  },
  {
    icon: "💬",
    title: "Just text it like an employee",
    body: 'Chat with your agent from the number you choose. "How did we do this week?" "Any leads we missed?" "Where am I wasting money?" It answers from your real numbers.',
  },
];

const steps = [
  { h: "Tell it about your business", p: "Name, services, service area, and the phone number you'll use to chat with it." },
  { h: "Connect your ads in one click", p: "Google Ads, Search Console, and Meta Ads — read-only to start, no setup headaches." },
  { h: "We build your website", p: "A fast, hosted site generated from your info, pre-wired to sync with Google Ads and Meta." },
  { h: "You stay in control", p: "It drafts everything. Nothing spends money or faces a customer without your approval." },
];

export default function Landing() {
  return (
    <div>
      <nav className="nav">
        <div className="brand">
          <span className="brand-mark">≈</span> Flowline
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn btn-ghost btn-sm" href="/dashboard">
            Sign in
          </Link>
          <Link className="btn btn-primary btn-sm" href="/onboarding">
            Get started
          </Link>
        </div>
      </nav>

      <header className="hero wrap">
        <span className="eyebrow">AI marketing manager for local business</span>
        <h1 className="title">
          The agent that runs your marketing,{" "}
          <span className="gradient-text">so you can run your business.</span>
        </h1>
        <p className="subtitle">
          Flowline connects your Google Ads, Meta, website, and leads into one AI
          agent you can just talk to. It works the way an owner thinks — in booked
          jobs and dollars — and never spends a cent or messages a customer without
          your say-so.
        </p>
        <div className="hero-cta">
          <Link className="btn btn-primary" href="/onboarding">
            Set up my business →
          </Link>
          <Link className="btn btn-ghost" href="/dashboard">
            See a live dashboard
          </Link>
        </div>
        <div className="hero-note">
          Built for trades and local services — like FreshFlow Dryer Vent Cleaning,
          our first business. Free to set up.
        </div>
      </header>

      <section className="section wrap">
        <h2>One agent. Your whole front office.</h2>
        <p className="lead">
          Stop stitching together five dashboards and a marketing agency. Flowline
          handles the surfaces that actually bring in jobs.
        </p>
        <div className="grid grid-3">
          {features.map((f) => (
            <div className="card" key={f.title}>
              <div className="ic">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section wrap">
        <h2>Up and running in four steps</h2>
        <p className="lead">
          No contracts, no onboarding calls. You can connect everything yourself in
          a few minutes.
        </p>
        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={s.h}>
              <div className="n">{i + 1}</div>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section wrap">
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, #0e1726, #18324a)",
            color: "#fff",
            textAlign: "center",
            padding: "40px 28px",
            border: "none",
          }}
        >
          <h2 style={{ color: "#fff", margin: "0 0 8px" }}>
            You stay the boss. It does the busywork.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.78)",
              maxWidth: 560,
              margin: "0 auto 22px",
              fontSize: 16,
              lineHeight: 1.55,
            }}
          >
            Two rules are always on: nothing that affects spend, and nothing a
            customer would see, goes live without your explicit approval. Flowline
            earns trust on read-only work first.
          </p>
          <Link className="btn btn-primary" href="/onboarding">
            Create my account
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          Flowline · AI marketing operations for local service businesses ·
          Spend gate &amp; reputation gate always on.
        </div>
      </footer>
    </div>
  );
}
