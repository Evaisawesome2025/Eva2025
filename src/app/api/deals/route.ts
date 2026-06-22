import { NextResponse } from "next/server";
import { listDeals } from "@/lib/data";

export const dynamic = "force-dynamic";

/** GET /api/deals — lightweight deal list for client-side search/maps. */
export async function GET() {
  const { deals, isSample } = await listDeals();
  return NextResponse.json({ deals, isSample });
}
