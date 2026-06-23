import { describe, it, expect } from "vitest";
import { summarizePortfolio } from "./portfolio";
import type { DealSummary } from "@/lib/data";

const deal = (over: Partial<DealSummary>): DealSummary => ({
  id: "x",
  formattedAddress: "1 Main St",
  city: "Sioux Falls",
  state: "SD",
  county: "Minnehaha County",
  latitude: null,
  longitude: null,
  purchasePrice: 100000,
  estimatedArv: 200000,
  estimatedRepairs: 30000,
  maxOffer: 110000,
  estimatedProfit: 40000,
  flipScore: 75,
  verdict: "green",
  status: "watching",
  updatedAt: "2026-06-01",
  ...over,
});

describe("summarizePortfolio", () => {
  it("returns zeros for an empty portfolio", () => {
    const s = summarizePortfolio([]);
    expect(s.totalDeals).toBe(0);
    expect(s.pipelineProfit).toBe(0);
    expect(s.avgFlipScore).toBe(0);
    expect(s.bestDeal).toBeNull();
  });

  it("aggregates counts, averages, and pipeline profit", () => {
    const s = summarizePortfolio([
      deal({ id: "a", estimatedProfit: 50000, flipScore: 80, verdict: "green" }),
      deal({
        id: "b",
        estimatedProfit: 10000,
        flipScore: 50,
        verdict: "yellow",
        status: "pursuing",
      }),
      deal({
        id: "c",
        estimatedProfit: -20000,
        flipScore: 20,
        verdict: "red",
        status: "passed",
      }),
    ]);
    expect(s.totalDeals).toBe(3);
    // passed deal excluded from pipeline: 50000 + 10000
    expect(s.pipelineProfit).toBe(60000);
    expect(s.avgFlipScore).toBe(50); // (80+50+20)/3
    expect(s.verdictCounts.green).toBe(1);
    expect(s.verdictCounts.red).toBe(1);
    expect(s.statusCounts.passed).toBe(1);
    expect(s.bestDeal?.id).toBe("a");
  });

  it("breaks down by county", () => {
    const s = summarizePortfolio([
      deal({ id: "a", county: "Minnehaha County" }),
      deal({ id: "b", county: "Minnehaha County" }),
      deal({ id: "c", county: "Lincoln County" }),
    ]);
    expect(s.byCounty[0].county).toBe("Minnehaha County");
    expect(s.byCounty[0].count).toBe(2);
    expect(s.byCounty).toHaveLength(2);
  });
});
