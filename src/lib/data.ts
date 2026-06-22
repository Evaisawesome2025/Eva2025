// Server-side data access layer.
//
// Each function tries the real database (Prisma + the authenticated Supabase
// user) and gracefully falls back to bundled sample data when the app isn't
// configured yet. This keeps the deployed URL useful in "demo mode" while
// becoming fully live the moment DATABASE_URL + Supabase env vars are set.

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/env";
import {
  SAMPLE_DEALS,
  getSampleDeal,
  type SampleDeal,
} from "@/lib/sample-data";
import type { Verdict } from "@/lib/types";

export type DealSummary = SampleDeal;

export interface DealNote {
  id: string;
  body: string;
  createdAt: string;
}

export interface DealComp {
  id: string;
  formattedAddress: string;
  salePrice: number | null;
  saleDate: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  distanceMiles: number | null;
  source: string | null;
}

export interface DealDetail extends DealSummary {
  propertyId: string;
  holdingMonths: number | null;
  financingCost: number | null;
  sellingCostPct: number | null;
  closingCostEstimate: number | null;
  notes: DealNote[];
  comps: DealComp[];
}

function asVerdict(value: string | null | undefined): Verdict {
  return value === "green" || value === "yellow" || value === "red"
    ? value
    : "red";
}

/** The currently authenticated Supabase user, or null in demo mode. */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

function mapSummary(deal: any): DealSummary {
  const analysis = deal.property?.analyses?.[0] ?? deal.analysis ?? {};
  const p = deal.property ?? {};
  return {
    id: deal.id,
    formattedAddress: p.formattedAddress ?? "",
    city: p.city ?? "",
    state: p.state ?? "",
    county: p.county ?? "",
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    purchasePrice: Number(analysis.purchasePrice ?? 0),
    estimatedArv: Number(analysis.estimatedArv ?? 0),
    estimatedRepairs: Number(analysis.estimatedRepairs ?? 0),
    maxOffer: Number(analysis.maxOffer ?? 0),
    estimatedProfit: Number(analysis.estimatedProfit ?? 0),
    flipScore: Number(analysis.flipScore ?? 0),
    verdict: asVerdict(analysis.verdict),
    status: deal.status ?? "watching",
    updatedAt: (deal.updatedAt ?? new Date()).toString().slice(0, 10),
  };
}

/** List the user's saved deals (newest first). Falls back to sample data. */
export async function listDeals(): Promise<{
  deals: DealSummary[];
  isSample: boolean;
}> {
  if (!isDatabaseConfigured) return { deals: SAMPLE_DEALS, isSample: true };
  try {
    const user = await getCurrentUser();
    if (!user) return { deals: SAMPLE_DEALS, isSample: true };

    const rows = await prisma.savedDeal.findMany({
      where: { userId: user.id },
      include: {
        property: {
          include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { deals: rows.map(mapSummary), isSample: false };
  } catch (err) {
    console.error("[data.listDeals]", err);
    return { deals: SAMPLE_DEALS, isSample: true };
  }
}

/** Full detail for one saved deal, including notes and comps. */
export async function getDealDetail(id: string): Promise<DealDetail | null> {
  if (!isDatabaseConfigured) return sampleDetail(id);
  try {
    const user = await getCurrentUser();
    if (!user) return sampleDetail(id);

    const deal = await prisma.savedDeal.findFirst({
      where: { id, userId: user.id },
      include: {
        property: {
          include: {
            analyses: { orderBy: { createdAt: "desc" }, take: 1 },
            comparables: { orderBy: { createdAt: "desc" } },
            notes: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });
    if (!deal) return null;

    const analysis = deal.property.analyses[0];
    return {
      ...mapSummary(deal),
      propertyId: deal.property.id,
      holdingMonths: analysis?.holdingMonths ?? null,
      financingCost: analysis ? Number(analysis.financingCost ?? 0) : null,
      sellingCostPct: analysis ? Number(analysis.sellingCostPct ?? 0) : null,
      closingCostEstimate: analysis
        ? Number(analysis.closingCostEstimate ?? 0)
        : null,
      notes: deal.property.notes.map((n) => ({
        id: n.id,
        body: n.body,
        createdAt: n.createdAt.toISOString().slice(0, 10),
      })),
      comps: deal.property.comparables.map((c) => ({
        id: c.id,
        formattedAddress: c.formattedAddress ?? "",
        salePrice: c.salePrice ? Number(c.salePrice) : null,
        saleDate: c.saleDate ? c.saleDate.toISOString().slice(0, 10) : null,
        beds: c.beds,
        baths: c.baths ? Number(c.baths) : null,
        sqft: c.sqft,
        distanceMiles: c.distanceMiles ? Number(c.distanceMiles) : null,
        source: c.source,
      })),
    };
  } catch (err) {
    console.error("[data.getDealDetail]", err);
    return sampleDetail(id);
  }
}

function sampleDetail(id: string): DealDetail | null {
  const deal = getSampleDeal(id);
  if (!deal) return null;
  return {
    ...deal,
    propertyId: deal.id,
    holdingMonths: 6,
    financingCost: 1500,
    sellingCostPct: 7,
    closingCostEstimate: 4000,
    notes: [],
    comps: [],
  };
}
