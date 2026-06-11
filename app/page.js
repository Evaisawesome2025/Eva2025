import { BUSINESS, SERVICE_AREAS, PRICING, REVIEWS } from "./business";

/* ── Small inline icons ───────────────────────────────────── */

const Logo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <rect width="48" height="48" rx="12" fill="url(#lg)" />
    <path
      d="M10 18h18a5 5 0 1 0-4.6-7M10 25h26a5 5 0 1 1-4.6 7M10 32h14a4 4 0 1 1-3.7 5.6"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48">
        <stop stopColor="#0e7c8c" />
        <stop offset="1" stopColor="#22b8cf" />
      </linearGradient>
    </defs>
  </svg>
);

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Shield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Alert = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3L2 21h20L12 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 10v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="18" r="1.2" fill="currentColor" />
  </svg>
);

const icons = {
  home: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11l9-8 9 8M5 10v10h14V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  building: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  wrench: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.7 6.3a4.5 4.5 0 0 0-5.9 5.9L3 18l3 3 5.8-5.8a4.5 4.5 0 0 0 5.9-5.9L14.5 12 12 9.5l2.7-3.2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* ── Page content ─────────────────────────────────────────── */

const WARNING_SIGNS = [
  "Clothes take more than one cycle to dry",
  "The dryer or laundry room feels unusually hot",
  "A burning or musty smell while the dryer runs",
  "Lint collecting around the dryer or outside vent",
  "The exterior vent flap barely opens when drying",
  "It's been more than a year since your last cleaning",
];

const SERVICES = [
  {
    icon: icons.home,
    title: "Residential Vent Cleaning",
    desc: "Complete cleaning of your dryer vent line from the dryer connection to the exterior hood. We remove built-up lint and debris, then verify airflow so your dryer runs the way it should.",
  },
  {
    icon: icons.building,
    title: "Multi-Unit & Commercial",
    desc: "Apartments, condos, rentals, and laundromats. We work with property managers on volume pricing and scheduled maintenance plans, with documentation for every unit serviced.",
  },
  {
    icon: icons.search,
    title: "Inspection & Airflow Testing",
    desc: "Camera inspection of the full vent run plus before-and-after airflow measurements. Ideal for new homeowners, real estate transactions, or peace of mind.",
  },
  {
    icon: icons.wrench,
    title: "Repairs & Bird Guards",
    desc: "Crushed lines, disconnected joints, code-violating flex duct, missing vent hoods, and bird or pest guard installation — fixed on the spot whenever possible.",
  },
];

const STEPS = [
  {
    title: "Inspect",
    desc: "We check the full vent run, measure baseline airflow, and show you exactly what we find.",
  },
  {
    title: "Clean",
    desc: "Rotary brushes and high-powered vacuum clear every foot of the line — no lint left behind.",
  },
  {
    title: "Verify",
    desc: "We re-test airflow and check the exterior hood so you can see the improvement yourself.",
  },
  {
    title: "Report",
    desc: "You get a tidy laundry room, photos, and honest recommendations. No upsells, ever.",
  },
];

const FAQS = [
  {
    q: "How often should my dryer vent be cleaned?",
    a: "Once a year for most homes. If you have a large family, pets, a long vent run, or notice longer dry times, every 6–9 months is a smart interval.",
  },
  {
    q: "How long does an appointment take?",
    a: "Most residential cleanings take 45–60 minutes. Longer vent runs, rooftop exits, or repairs can add time — we'll tell you up front before we start.",
  },
  {
    q: "Do I need to do anything before you arrive?",
    a: "Just make sure we can reach the dryer and the area around it. We handle moving the dryer, protecting your floors, and cleaning up after ourselves.",
  },
  {
    q: "Will this actually lower my energy bill?",
    a: "A clogged vent forces the dryer to run longer and hotter. Restoring full airflow typically cuts dry times noticeably, which means less electricity or gas per load and less wear on your machine.",
  },
  {
    q: "Are you licensed and insured?",
    a: "Yes — fully insured and locally owned right here in Sioux Falls. If you'd like proof of insurance for a commercial property, just ask.",
  },
  {
    q: "What if you find a problem you can't fix that day?",
    a: "We'll document it with photos, explain your options in plain English, and give you a written quote. You'll never be pressured into a decision on the spot.",
  },
];

export default function Home() {
  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <div className="container">
          <span>
            Serving {BUSINESS.city}, {BUSINESS.state} &amp; surrounding
            communities
          </span>
          <span>
            {BUSINESS.hours} · <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>
          </span>
        </div>
      </div>

      {/* Nav */}
      <header className="nav">
        <div className="container">
          <a href="#top" className="brand">
            <Logo />
            <span>
              <span className="brand-name">
                Fresh<span>Flow</span>
              </span>
              <span className="brand-sub">Dryer Vent Cleaning</span>
            </span>
          </a>
          <nav className="nav-links">
            <a href="#services">Services</a>
            <a href="#why">Why It Matters</a>
            <a href="#pricing">Pricing</a>
            <a href="#reviews">Reviews</a>
            <a href="#faq">FAQ</a>
            <a href="#contact" className="btn btn-flame">
              Get a Free Quote
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="hero" style={{ padding: 0 }}>
          <div className="container">
            <span className="hero-eyebrow">
              <Shield /> Locally owned &amp; insured · {BUSINESS.city},{" "}
              {BUSINESS.state}
            </span>
            <h1>
              Breathe easy. Dry faster. <em>Stay safe.</em>
            </h1>
            <p className="lede">
              A clogged dryer vent is the #1 cause of home dryer fires — and
              the reason your laundry takes two cycles. FreshFlow restores
              full airflow in about an hour, with upfront pricing and proof
              you can see.
            </p>
            <div className="hero-ctas">
              <a href={BUSINESS.phoneHref} className="btn btn-flame">
                Call {BUSINESS.phone}
              </a>
              <a href="#pricing" className="btn btn-ghost">
                See Pricing
              </a>
            </div>
            <div className="hero-badges">
              <span>
                <Shield /> Satisfaction guaranteed
              </span>
              <span>
                <Shield /> Upfront flat-rate pricing
              </span>
              <span>
                <Shield /> Before &amp; after airflow proof
              </span>
            </div>
          </div>
          <svg
            className="hero-wave"
            viewBox="0 0 1440 70"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 70V35c120-25 280-35 480-20s400 40 600 30 280-35 360-40v65z"
              fill="currentColor"
            />
          </svg>
        </section>

        {/* Stats */}
        <div className="stats">
          <div className="container">
            <div className="stat">
              <strong>~2,900</strong>
              <span>home dryer fires reported in the U.S. every year*</span>
            </div>
            <div className="stat">
              <strong>34%</strong>
              <span>
                of dryer fires are caused by failure to clean the vent*
              </span>
            </div>
            <div className="stat">
              <strong>1 hr</strong>
              <span>is all most cleanings take, start to finish</span>
            </div>
          </div>
        </div>

        {/* Warning signs */}
        <section className="warning" id="signs">
          <div className="container">
            <div className="section-head">
              <span className="kicker">Warning Signs</span>
              <h2>Is your dryer trying to tell you something?</h2>
              <p>
                If any of these sound familiar, your vent is overdue for a
                cleaning.
              </p>
            </div>
            <div className="sign-grid">
              {WARNING_SIGNS.map((sign) => (
                <div className="sign" key={sign}>
                  <Alert />
                  <p>{sign}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services">
          <div className="container">
            <div className="section-head">
              <span className="kicker">What We Do</span>
              <h2>Dryer vent services, done right</h2>
              <p>
                One specialty, mastered — every job ends with measured airflow
                and a laundry room cleaner than we found it.
              </p>
            </div>
            <div className="service-grid">
              {SERVICES.map((s) => (
                <div className="service" key={s.title}>
                  <div className="icon">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why it matters */}
        <section className="why" id="why">
          <div className="container">
            <div className="section-head">
              <span className="kicker">Why It Matters</span>
              <h2>Lint isn&apos;t harmless — it&apos;s fuel</h2>
              <p>
                Every load of laundry sends lint into your vent line. Over
                time it chokes airflow, overheats your dryer, and puts your
                home at risk.
              </p>
            </div>
            <div className="why-grid">
              <div className="why-card">
                <div className="big">🔥</div>
                <h3>Fire prevention</h3>
                <p>
                  Lint is highly flammable, and a restricted vent traps the
                  heat that ignites it. Annual cleaning is the single best
                  way to remove the risk.
                </p>
              </div>
              <div className="why-card">
                <div className="big">⚡</div>
                <h3>Lower energy bills</h3>
                <p>
                  A blocked vent can force two or three cycles per load. Full
                  airflow means faster drying and less gas or electricity
                  burned per basket.
                </p>
              </div>
              <div className="why-card">
                <div className="big">🧺</div>
                <h3>A longer-lasting dryer</h3>
                <p>
                  Overheating cooks heating elements, thermostats, and
                  bearings. Clean vents keep your machine running cooler —
                  and out of the repair shop.
                </p>
              </div>
            </div>
            <p className="why-note">
              *Source: U.S. Fire Administration (FEMA) national estimates for
              clothes dryer fires in residential buildings.
            </p>
          </div>
        </section>

        {/* Process */}
        <section id="process">
          <div className="container">
            <div className="section-head">
              <span className="kicker">How It Works</span>
              <h2>Our 4-step FreshFlow process</h2>
              <p>
                No mystery, no mess, no upsells — just a clean vent and proof
                it worked.
              </p>
            </div>
            <div className="steps">
              {STEPS.map((step, i) => (
                <div className="step" key={step.title}>
                  <div className="num">{i + 1}</div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="pricing" id="pricing">
          <div className="container">
            <div className="section-head">
              <span className="kicker">Pricing</span>
              <h2>Simple, flat-rate pricing</h2>
              <p>
                The price we quote is the price you pay. No surprises at the
                door.
              </p>
            </div>
            <div className="price-grid">
              {PRICING.map((tier) => (
                <div
                  className={`price-card${tier.featured ? " featured" : ""}`}
                  key={tier.name}
                >
                  {tier.featured && <span className="pill">{tier.note}</span>}
                  <h3>{tier.name}</h3>
                  <div className="price">{tier.price}</div>
                  <div className="note">
                    {tier.featured ? " " : tier.note}
                  </div>
                  <ul>
                    {tier.features.map((f) => (
                      <li key={f}>
                        <Check />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={BUSINESS.phoneHref}
                    className={`btn ${
                      tier.featured ? "btn-flame" : "btn-outline"
                    }`}
                  >
                    Book Now
                  </a>
                </div>
              ))}
            </div>
            <p className="pricing-fineprint">
              Rooftop vent exits and runs over 25 feet may require a small
              additional charge — we&apos;ll always confirm before starting.
            </p>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews">
          <div className="container">
            <div className="section-head">
              <span className="kicker">Reviews</span>
              <h2>Neighbors who breathe easier</h2>
              <p>
                We earn our reputation one laundry room at a time.
              </p>
            </div>
            <div className="review-grid">
              {REVIEWS.map((r) => (
                <div className="review" key={r.name}>
                  <div className="stars" aria-label="5 out of 5 stars">
                    ★★★★★
                  </div>
                  <p>&ldquo;{r.quote}&rdquo;</p>
                  <div className="who">
                    {r.name}
                    <span>{r.place}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service area */}
        <section className="area" id="area">
          <div className="container">
            <div className="section-head">
              <span className="kicker">Service Area</span>
              <h2>Proudly serving the Sioux Falls metro</h2>
            </div>
            <div className="area-chips">
              {SERVICE_AREAS.map((city) => (
                <span key={city}>{city}</span>
              ))}
            </div>
            <p className="area-note">
              Outside these areas? Give us a call — we can often make it
              work.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <div className="container">
            <div className="section-head">
              <span className="kicker">FAQ</span>
              <h2>Questions, answered</h2>
            </div>
            <div className="faq-list">
              {FAQS.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="contact" id="contact">
          <div className="container">
            <h2>Ready for a safer, faster dryer?</h2>
            <p className="lede">
              Call or email for a free quote — most appointments available
              within the week.
            </p>
            <a href={BUSINESS.phoneHref} className="btn btn-flame">
              Call {BUSINESS.phone}
            </a>
            <div className="contact-cards">
              <div className="contact-card">
                <div className="label">Phone</div>
                <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>
              </div>
              <div className="contact-card">
                <div className="label">Email</div>
                <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
              </div>
              <div className="contact-card">
                <div className="label">Hours</div>
                <div className="value">{BUSINESS.hours}</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <span>
            © {new Date().getFullYear()} {BUSINESS.name} · {BUSINESS.city},{" "}
            {BUSINESS.state}
          </span>
          <span>
            <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>
            {" · "}
            <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
          </span>
        </div>
      </footer>
    </>
  );
}
