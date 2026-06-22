import { describe, it, expect } from "vitest";
import {
  calculateMaxOffer,
  calculateEstimatedProfit,
  calculateTotalInvested,
  calculateFlipScore,
  scoreToVerdict,
  analyzeDeal,
} from "./dealScoringService";
import type { AnalysisInputs } from "@/lib/types";

const strongDeal: AnalysisInputs = {
  purchasePrice: 150000,
  estimatedArv: 300000,
  estimatedRepairs: 40000,
  holdingMonths: 6,
  financingCost: 1500,
  sellingCostPct: 7,
  closingCostEstimate: 4000,
};

describe("calculateMaxOffer (70% rule)", () => {
  it("computes ARV * 0.70 - repairs", () => {
    // 300000 * 0.7 - 40000 = 170000
    expect(calculateMaxOffer(300000, 40000)).toBe(170000);
  });
  it("can go negative with heavy repairs", () => {
    expect(calculateMaxOffer(100000, 80000)).toBe(-10000);
  });
});

describe("calculateEstimatedProfit", () => {
  it("subtracts every cost from ARV", () => {
    // 300000 - 150000 - 40000 - (1500*6) - (300000*0.07) - 4000
    // = 300000 - 150000 - 40000 - 9000 - 21000 - 4000 = 76000
    expect(calculateEstimatedProfit(strongDeal)).toBe(76000);
  });
});

describe("calculateTotalInvested", () => {
  it("sums purchase, repairs, holding, and closing", () => {
    // 150000 + 40000 + 9000 + 4000 = 203000
    expect(calculateTotalInvested(strongDeal)).toBe(203000);
  });
});

describe("calculateFlipScore + verdict", () => {
  it("scores a strong deal green (>= 70)", () => {
    const score = calculateFlipScore(strongDeal);
    expect(score).toBeGreaterThanOrEqual(70);
    expect(scoreToVerdict(score)).toBe("green");
  });

  it("scores a clearly bad deal red", () => {
    const badDeal: AnalysisInputs = {
      purchasePrice: 280000,
      estimatedArv: 290000,
      estimatedRepairs: 50000,
      holdingMonths: 8,
      financingCost: 2000,
      sellingCostPct: 7,
      closingCostEstimate: 5000,
    };
    const score = calculateFlipScore(badDeal);
    expect(score).toBeLessThan(45);
    expect(scoreToVerdict(score)).toBe("red");
  });

  it("clamps the score to the 0–100 range", () => {
    const score = calculateFlipScore(strongDeal);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("scoreToVerdict thresholds", () => {
  it("maps boundaries correctly", () => {
    expect(scoreToVerdict(70)).toBe("green");
    expect(scoreToVerdict(69)).toBe("yellow");
    expect(scoreToVerdict(45)).toBe("yellow");
    expect(scoreToVerdict(44)).toBe("red");
  });
});

describe("config-driven scoring", () => {
  it("a custom ARV multiplier changes the max offer", () => {
    expect(calculateMaxOffer(300000, 40000, 0.75)).toBe(185000);
    expect(calculateMaxOffer(300000, 40000, 0.65)).toBe(155000);
  });

  it("custom verdict thresholds reclassify a score", () => {
    // With a stricter green bar, a 72 is no longer green.
    expect(
      scoreToVerdict(72, {
        arvMultiplier: 0.7,
        targetRoiPct: 30,
        targetMarginPct: 25,
        greenThreshold: 80,
        yellowThreshold: 50,
      })
    ).toBe("yellow");
  });

  it("a higher ROI target lowers the score for the same deal", () => {
    const lenient = calculateFlipScore(strongDeal, {
      arvMultiplier: 0.7,
      targetRoiPct: 20,
      targetMarginPct: 25,
      greenThreshold: 70,
      yellowThreshold: 45,
    });
    const strict = calculateFlipScore(strongDeal, {
      arvMultiplier: 0.7,
      targetRoiPct: 50,
      targetMarginPct: 25,
      greenThreshold: 70,
      yellowThreshold: 45,
    });
    expect(lenient).toBeGreaterThanOrEqual(strict);
  });
});

describe("analyzeDeal", () => {
  it("returns all computed fields consistently", () => {
    const result = analyzeDeal(strongDeal);
    expect(result.maxOffer).toBe(170000);
    expect(result.estimatedProfit).toBe(76000);
    expect(result.verdict).toBe(scoreToVerdict(result.flipScore));
    // ROI = 76000 / 203000 ≈ 37.4%
    expect(result.roiPercent).toBeGreaterThan(35);
  });

  it("handles all-zero inputs without dividing by zero", () => {
    const zero: AnalysisInputs = {
      purchasePrice: 0,
      estimatedArv: 0,
      estimatedRepairs: 0,
      holdingMonths: 0,
      financingCost: 0,
      sellingCostPct: 0,
      closingCostEstimate: 0,
    };
    const result = analyzeDeal(zero);
    expect(result.estimatedProfit).toBe(0);
    expect(result.roiPercent).toBe(0);
    expect(Number.isFinite(result.flipScore)).toBe(true);
  });
});
