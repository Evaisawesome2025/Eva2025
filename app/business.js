// ─────────────────────────────────────────────────────────────
//  FreshFlow Dryer Vent Cleaning — business details
//  Edit everything in this file to update the website's
//  phone number, email, hours, pricing, reviews, and service area.
// ─────────────────────────────────────────────────────────────

export const BUSINESS = {
  name: "FreshFlow Dryer Vent Cleaning",
  tagline: "Breathe easy. Dry faster. Stay safe.",
  city: "Sioux Falls",
  state: "SD",
  // TODO: replace with your real phone number
  phone: "(605) 555-0134",
  phoneHref: "tel:+16055550134",
  // TODO: replace with your real business email
  email: "hello@freshflowdryervent.com",
  hours: "Mon–Sat · 8am–6pm",
  url: "https://www.freshflowdryervent.com",
};

export const SERVICE_AREAS = [
  "Sioux Falls",
  "Harrisburg",
  "Tea",
  "Brandon",
  "Hartford",
  "Crooks",
  "Dell Rapids",
  "Canton",
  "Lennox",
  "Worthing",
];

// TODO: confirm or adjust your real pricing
export const PRICING = [
  {
    name: "Standard Clean",
    price: "$129",
    note: "Most homes",
    features: [
      "Full vent line cleaning, dryer to exterior",
      "Lint trap & dryer connection cleaning",
      "Airflow test before & after",
      "Exterior vent hood check",
    ],
    featured: false,
  },
  {
    name: "Clean + Inspect",
    price: "$169",
    note: "Best value",
    features: [
      "Everything in Standard Clean",
      "Camera inspection of the full vent run",
      "Bird/pest guard check",
      "Written safety report with photos",
    ],
    featured: true,
  },
  {
    name: "Multi-Unit / Commercial",
    price: "Custom",
    note: "Quoted per property",
    features: [
      "Apartments, condos & laundromats",
      "Volume pricing for property managers",
      "Scheduled maintenance plans",
      "Compliance documentation",
    ],
    featured: false,
  },
];

// TODO: replace these sample reviews with your real customer reviews
// (e.g. copied from your Google Business Profile, with permission).
export const REVIEWS = [
  {
    quote:
      "Our dryer went from three cycles per load back to one. They showed me the pile of lint that came out — I had no idea it was that bad. Fast, friendly, and tidy.",
    name: "Sarah M.",
    place: "Sioux Falls",
  },
  {
    quote:
      "On time, upfront pricing, and they tested the airflow before and after so I could see the difference. Exactly how a local service company should operate.",
    name: "Dave K.",
    place: "Harrisburg",
  },
  {
    quote:
      "They found a crushed vent line behind our dryer and fixed it on the spot. Our laundry room finally stopped smelling musty. Highly recommend.",
    name: "Jess & Tyler R.",
    place: "Brandon",
  },
];
