import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Approved data-source registry. Mirrors the seed block in supabase/schema.sql.
const DATA_SOURCES = [
  {
    key: "google_geocoding",
    name: "Google Geocoding & Places",
    category: "geocoding",
    approved: true,
    enabled: true,
    notes: "Address autocomplete + county lookup.",
  },
  {
    key: "rentcast",
    name: "RentCast",
    category: "valuation",
    approved: true,
    enabled: false,
    notes: "AVM, rent estimates, comps. Add RENTCAST_API_KEY.",
  },
  {
    key: "attom",
    name: "ATTOM Data",
    category: "public_records",
    approved: true,
    enabled: false,
    notes: "Property + sales history. Add ATTOM_API_KEY.",
  },
  {
    key: "county_gis",
    name: "County GIS / Open Data",
    category: "public_records",
    approved: true,
    enabled: false,
    notes: "Minnehaha/Lincoln County parcel data.",
  },
  {
    key: "mls_idx",
    name: "Broker MLS / IDX Feed",
    category: "comps",
    approved: true,
    enabled: false,
    notes: "Licensed IDX feed only.",
  },
];

async function main() {
  for (const source of DATA_SOURCES) {
    await prisma.dataSource.upsert({
      where: { key: source.key },
      update: source,
      create: source,
    });
  }
  console.log(`Seeded ${DATA_SOURCES.length} data sources.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
