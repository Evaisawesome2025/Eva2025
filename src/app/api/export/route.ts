import { NextResponse } from "next/server";
import { listDeals, type DealSummary } from "@/lib/data";

const COLUMNS: { key: keyof DealSummary; label: string }[] = [
  { key: "formattedAddress", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "county", label: "County" },
  { key: "purchasePrice", label: "Purchase Price" },
  { key: "estimatedArv", label: "ARV" },
  { key: "estimatedRepairs", label: "Repairs" },
  { key: "maxOffer", label: "Max Offer" },
  { key: "estimatedProfit", label: "Estimated Profit" },
  { key: "flipScore", label: "Flip Score" },
  { key: "verdict", label: "Verdict" },
  { key: "status", label: "Status" },
];

function csvCell(value: unknown): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET /api/export?format=csv|json — download the deal pipeline. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";
  const { deals } = await listDeals();
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return new NextResponse(JSON.stringify(deals, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="flip-radar-deals-${stamp}.json"`,
      },
    });
  }

  const header = COLUMNS.map((c) => c.label).join(",");
  const rows = deals.map((d) =>
    COLUMNS.map((c) => csvCell(d[c.key])).join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="flip-radar-deals-${stamp}.csv"`,
    },
  });
}
