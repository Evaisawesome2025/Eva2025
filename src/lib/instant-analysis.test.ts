import { describe, it, expect } from "vitest";
import {
  estimateArv,
  estimateRepairs,
  recommendFlip,
  REHAB_PER_SQFT,
} from "./instant-analysis";
import type { AnalysisResult } from "@/lib/types";

describe("estimateArv", () => {
  it("multiplies $/sqft by sqft", () => {
    expect(estimateArv(185, 1500)).toBe(277500);
  });
  it("handles zeros", () => {
    expect(estimateArv(0, 1500)).toBe(0);
    expect(estimateArv(185, 0)).toBe(0);
  });
});

describe("estimateRepairs", () => {
  it("uses per-sqft rehab cost by condition", () => {
    expect(estimateRepairs("light", 1500)).toBe(REHAB_PER_SQFT.light * 1500);
    expect(estimateRepairs("gut", 1000)).toBe(75000);
  });
});

const make = (over: Partial<AnalysisResult>): AnalysisResult => ({
  maxOffer: 170000,
  estimatedProfit: 50000,
  roiPercent: 30,
  flipScore: 78,
  verdict: "green",
  ...over,
});

describe("recommendFlip", () => {
  it("recommends GOOD for a strong, disciplined deal", () => {
    const r = recommendFlip(make({}), 160000, 170000);
    expect(r.rec).toBe("good");
  });

  it("recommends PASS when there's no profit", () => {
    const r = recommendFlip(make({ estimatedProfit: -5000 }), 160000, 170000);
    expect(r.rec).toBe("pass");
  });

  it("recommends PASS when price is well above max offer", () => {
    const r = recommendFlip(make({}), 200000, 170000);
    expect(r.rec).toBe("pass");
  });

  it("recommends MAYBE for a marginal deal", () => {
    const r = recommendFlip(
      make({ flipScore: 55, estimatedProfit: 18000 }),
      168000,
      170000
    );
    expect(r.rec).toBe("maybe");
  });
});
