import "./globals.css";
import { BUSINESS, SERVICE_AREAS } from "./business";

export const metadata = {
  title: `${BUSINESS.name} | Dryer Vent Cleaning in Sioux Falls, SD`,
  description:
    "Professional dryer vent cleaning in Sioux Falls, SD. Reduce fire risk, dry clothes faster, and lower energy bills. Locally owned, upfront pricing, satisfaction guaranteed. Get your free quote today.",
  keywords: [
    "dryer vent cleaning",
    "Sioux Falls",
    "South Dakota",
    "dryer vent inspection",
    "lint removal",
    "dryer fire prevention",
  ],
  openGraph: {
    title: `${BUSINESS.name} | Sioux Falls, SD`,
    description:
      "Breathe easy. Dry faster. Stay safe. Professional dryer vent cleaning serving Sioux Falls and surrounding communities.",
    type: "website",
    url: BUSINESS.url,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: BUSINESS.name,
  description:
    "Professional dryer vent cleaning, inspection, and repair serving Sioux Falls, SD and surrounding communities.",
  url: BUSINESS.url,
  telephone: BUSINESS.phone,
  email: BUSINESS.email,
  address: {
    "@type": "PostalAddress",
    addressLocality: BUSINESS.city,
    addressRegion: BUSINESS.state,
    addressCountry: "US",
  },
  areaServed: SERVICE_AREAS.map((name) => ({ "@type": "City", name })),
  openingHours: "Mo-Sa 08:00-18:00",
  priceRange: "$$",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
