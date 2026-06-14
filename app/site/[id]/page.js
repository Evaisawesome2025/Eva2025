import { getAccount } from "../../../lib/store.js";
import { buildWebsite } from "../../../lib/website.js";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const account = await getAccount(params.id);
  if (!account) return { title: "Site not found" };
  const b = account.business || {};
  return {
    title: `${b.name} — ${b.category || "Home Services"}`,
    description: `Licensed, insured ${(
      b.category || "home services"
    ).toLowerCase()} in ${b.serviceArea || "your area"}. Call ${b.phone || ""}.`,
  };
}

export default async function BusinessSite({ params }) {
  const account = await getAccount(params.id);

  if (!account) {
    return (
      <div style={{ textAlign: "center", padding: "120px 20px", fontFamily: "system-ui" }}>
        <h1>Site not found</h1>
        <p style={{ color: "#666" }}>This business site doesn’t exist yet.</p>
      </div>
    );
  }

  const w = buildWebsite(account);

  // Self-contained styling so the business site looks distinct from Flowline.
  const css = `
    .bs{--accent:#1f6feb;--ink:#10202e;--muted:#5a6b7b;--bg:#f7faff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--ink);background:#fff;}
    .bs *{box-sizing:border-box}
    .bs .bar{background:var(--ink);color:#fff;text-align:center;padding:8px;font-size:14px}
    .bs .bar a{color:#9fd0ff;font-weight:700;text-decoration:none}
    .bs header{display:flex;justify-content:space-between;align-items:center;padding:18px 28px;max-width:1080px;margin:0 auto}
    .bs .logo{font-weight:800;font-size:22px;letter-spacing:-.02em}
    .bs .callbtn{background:var(--accent);color:#fff;padding:11px 20px;border-radius:10px;font-weight:700;text-decoration:none;font-size:15px}
    .bs .hero{background:linear-gradient(160deg,#0b2545,#1f6feb);color:#fff;padding:64px 28px;text-align:center}
    .bs .hero h1{font-size:42px;max-width:760px;margin:0 auto 16px;line-height:1.1;letter-spacing:-.02em}
    .bs .hero p{font-size:19px;max-width:600px;margin:0 auto 28px;opacity:.92;line-height:1.5}
    .bs .hero .cta{display:inline-flex;gap:12px;flex-wrap:wrap;justify-content:center}
    .bs .btn-w{background:#fff;color:var(--accent);padding:14px 26px;border-radius:11px;font-weight:800;text-decoration:none;font-size:16px}
    .bs .btn-o{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.4);padding:14px 26px;border-radius:11px;font-weight:700;text-decoration:none;font-size:16px}
    .bs .badges{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;padding:26px;max-width:900px;margin:0 auto}
    .bs .badge{display:flex;gap:8px;align-items:center;font-weight:650;font-size:15px;color:var(--ink)}
    .bs section{max-width:1080px;margin:0 auto;padding:48px 28px}
    .bs h2{font-size:30px;text-align:center;margin:0 0 8px;letter-spacing:-.02em}
    .bs .sub{text-align:center;color:var(--muted);max-width:560px;margin:0 auto 32px;font-size:17px}
    .bs .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
    .bs .svc{background:var(--bg);border:1px solid #e3edf9;border-radius:14px;padding:24px}
    .bs .svc h3{margin:0 0 8px;font-size:19px}
    .bs .svc p{margin:0;color:var(--muted);line-height:1.55;font-size:15px}
    .bs .why{background:var(--bg)}
    .bs .quote{background:#fff;border:1px solid #e3edf9;border-radius:14px;padding:24px;font-size:16px;line-height:1.6}
    .bs .quote .who{color:var(--muted);font-size:14px;margin-top:12px;font-weight:600}
    .bs .stars{color:#f5a623;font-size:18px}
    .bs .contact{background:linear-gradient(160deg,#0b2545,#1f6feb);color:#fff;text-align:center;border-radius:20px;padding:48px 28px;margin:0 28px}
    .bs .contact h2{color:#fff}
    .bs .phone{font-size:34px;font-weight:800;margin:14px 0;letter-spacing:-.01em}
    .bs footer{text-align:center;color:var(--muted);padding:30px;font-size:14px}
    @media(max-width:760px){.bs .grid{grid-template-columns:1fr}.bs .hero h1{font-size:32px}}
  `;

  return (
    <div className="bs">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="bar">
        ⚡ Now booking in {w.area} — call or text{" "}
        <a href={w.telHref}>{w.phone}</a>
      </div>

      <header>
        <div className="logo">{w.name}</div>
        <a className="callbtn" href={w.telHref}>
          📞 {w.phone || "Call us"}
        </a>
      </header>

      <div className="hero">
        <h1>{w.tagline}</h1>
        <p>{w.intro}</p>
        <div className="cta">
          <a className="btn-w" href={w.telHref}>
            Get a free quote
          </a>
          <a className="btn-o" href="#services">
            See our services
          </a>
        </div>
      </div>

      <div className="badges">
        {w.badges.map((b) => (
          <div className="badge" key={b.label}>
            <span style={{ fontSize: 20 }}>{b.icon}</span> {b.label}
          </div>
        ))}
      </div>

      <section id="services">
        <h2>What we do</h2>
        <p className="sub">
          Trusted {w.category.toLowerCase()} for homeowners and property managers.
        </p>
        <div className="grid">
          {w.services.map((s) => (
            <div className="svc" key={s.name}>
              <h3>{s.name}</h3>
              <p>{s.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="why">
        <section>
          <h2>Why {w.name}</h2>
          <p className="sub">Local, licensed, and easy to work with.</p>
          <div className="grid">
            {w.reasons.map((r) => (
              <div className="svc" key={r.title}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{r.icon}</div>
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
        <h2>What customers say</h2>
        <p className="sub">Real results from neighbors in {w.area}.</p>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {w.testimonials.map((t, i) => (
            <div className="quote" key={i}>
              <div className="stars">★★★★★</div>
              <div style={{ marginTop: 8 }}>“{t.quote}”</div>
              <div className="who">— {t.author}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="contact">
        <div className="contact">
          <h2>Ready to book?</h2>
          <p style={{ opacity: 0.9, fontSize: 17 }}>
            Call or text now for a free, no-obligation quote.
          </p>
          <div className="phone">{w.phone}</div>
          <a className="btn-w" href={w.telHref}>
            📞 Call {w.name}
          </a>
        </div>
      </section>

      <footer>
        © {new Date().getFullYear()} {w.name} · {w.category} · Serving {w.area}
        <br />
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          Website built &amp; managed by Flowline
        </span>
      </footer>
    </div>
  );
}
