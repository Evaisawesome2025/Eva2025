import type { DealSummary } from "@/lib/data";
import type { Verdict } from "@/lib/types";

export interface CountyBreakdown {
  county: string;
  count: number;
  totalProfit: number;
  avgScore: number;
}

export interface PortfolioSummary {
  totalDeals: number;
  /** Pipeline profit excludes deals you've passed on. */
  pipelineProfit: number;
  avgFlipScore: number;
  avgProfit: number;
  totalArv: number;
  totalCapitalRequired: number; // purchase + repairs across active deals
  verdictCounts: Record<Verdict, number>;
  statusCounts: Record<string, number>;
  byCounty: CountyBreakdown[];
  bestDeal: DealSummary | null;
}

const STATUSES = [
  "watching",
  "pursuing",
  "offer_made",
  "under_contract",
  "passed",
];

/** Aggregate a list of deals into portfolio-level analytics. */
export function summarizePortfolio(deals: DealSummary[]): PortfolioSummary {
  const active = deals.filter((d) => d.status !== "passed");

  const verdictCounts: Record<Verdict, number> = { green: 0, yellow: 0, red: 0 };
  const statusCounts: Record<string, number> = {};
  STATUSES.forEach((s) => (statusCounts[s] = 0));

  const countyMap = new Map<
    string,
    { count: number; totalProfit: number; scoreSum: number }
  >();

  for (const d of deals) {
    verdictCounts[d.verdict] = (verdictCounts[d.verdict] ?? 0) + 1;
    statusCounts[d.status] = (statusCounts[d.status] ?? 0) + 1;

    const county = d.county || "Unknown";
    const entry =
      countyMap.get(county) ?? { count: 0, totalProfit: 0, scoreSum: 0 };
    entry.count += 1;
    entry.totalProfit += d.estimatedProfit;
    entry.scoreSum += d.flipScore;
    countyMap.set(county, entry);
  }

  const byCounty: CountyBreakdown[] = [...countyMap.entries()]
    .map(([county, e]) => ({
      county,
      count: e.count,
      totalProfit: e.totalProfit,
      avgScore: Math.round(e.scoreSum / e.count),
    }))
    .sort((a, b) => b.count - a.count);

  const bestDeal =
    deals.length === 0
      ? null
      : deals.reduce((a, b) => (b.estimatedProfit > a.estimatedProfit ? b : a));

  return {
    totalDeals: deals.length,
    pipelineProfit: active.reduce((s, d) => s + d.estimatedProfit, 0),
    avgFlipScore:
      deals.length === 0
        ? 0
        : Math.round(
            deals.reduce((s, d) => s + d.flipScore, 0) / deals.length
          ),
    avgProfit:
      deals.length === 0
        ? 0
        : Math.round(
            deals.reduce((s, d) => s + d.estimatedProfit, 0) / deals.length
          ),
    totalArv: deals.reduce((s, d) => s + d.estimatedArv, 0),
    totalCapitalRequired: active.reduce(
      (s, d) => s + d.purchasePrice + d.estimatedRepairs,
      0
    ),
    verdictCounts,
    statusCounts,
    byCounty,
    bestDeal,
  };
}
