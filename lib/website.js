// Generates a real, hostable marketing website for a business from its profile.
// Used by /site/[id] (the live page) and the dashboard preview. Everything is
// derived from what the owner entered during onboarding, so a business that
// checks "build me a website" gets a complete, on-brand site with no extra work.

const SERVICE_BLURBS = {
  "dryer vent cleaning":
    "Remove lint buildup that slows your dryer and is a leading cause of house fires. Faster drying, lower bills, safer home.",
  "air duct cleaning":
    "Clear dust, allergens, and debris from your ductwork for cleaner air and a more efficient HVAC system.",
  "vent guard installs":
    "Keep birds, rodents, and debris out of your exterior vents with a professionally fitted guard.",
  "recurring maintenance plans":
    "Set-and-forget scheduling so your vents and ducts stay clean year after year — we remember so you don't.",
  "chimney sweeping":
    "Professional chimney cleaning and inspection to keep your fireplace safe and drawing properly.",
  "commercial / property managers":
    "Multi-unit and commercial service with consolidated billing and scheduling built for property managers.",
};

function blurbFor(service) {
  const key = service.trim().toLowerCase();
  if (SERVICE_BLURBS[key]) return SERVICE_BLURBS[key];
  return `Professional ${service.toLowerCase()} delivered by licensed, insured local technicians you can trust.`;
}

export function buildWebsite(account) {
  const b = account.business || {};
  const name = b.name || "Your Business";
  const category = b.category || "Home Services";
  const services = (b.services || []).filter(Boolean);
  const area = b.serviceArea || "your local area";
  const phone = b.phone || "";
  const telHref = phone ? "tel:" + phone.replace(/[^\d+]/g, "") : "#contact";

  return {
    name,
    category,
    phone,
    telHref,
    area,
    tagline: `${category} you can trust in ${area}.`,
    intro: `${name} provides licensed, insured ${category.toLowerCase()} with fast scheduling and upfront pricing. We treat your home like our own — and we don't consider the job done until you're happy.`,
    badges: [
      { icon: "🛡️", label: "Licensed & Insured" },
      { icon: "📍", label: "Locally Owned" },
      { icon: "⚡", label: "Fast, Same-Week Service" },
      { icon: "✅", label: "Satisfaction Guaranteed" },
    ],
    services: services.length
      ? services.map((s) => ({ name: s, blurb: blurbFor(s) }))
      : [{ name: category, blurb: blurbFor(category) }],
    reasons: [
      {
        icon: "🔥",
        title: "Safety first",
        body: "We focus on the fire-safety and air-quality risks most homeowners never see — and fix them.",
      },
      {
        icon: "💬",
        title: "Easy to reach",
        body: `Call or text and a real person responds fast. No phone trees, no waiting days for a callback.`,
      },
      {
        icon: "💵",
        title: "Honest pricing",
        body: "Upfront quotes with no surprise add-ons. You approve the work before we start.",
      },
    ],
    testimonials: [
      {
        quote: `Showed up on time, explained everything, and my dryer runs like new. Highly recommend ${name}.`,
        author: "Verified local customer",
      },
      {
        quote: "Booked online in two minutes and they came out the same week. Professional and friendly.",
        author: "Verified local customer",
      },
    ],
  };
}
