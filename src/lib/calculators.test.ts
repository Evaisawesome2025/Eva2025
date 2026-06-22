import { describe, it, expect } from "vitest";
import {
  sumLineItems,
  withContingency,
  estimateArvFromComps,
  computeFinancing,
  buildSensitivityGrid,
  DEFAULT_REPAIR_CATALOG,
} from "./calculators";
import type { AnalysisInputs } from "@/lib/types";

describe("sumLineItems", () => {
  it("totals line-item costs", () => {
    expect(
      sumLineItems([
        { key: "a", label: "A", cost: 5000 },
        { key: "b", label: "B", cost: 12000 },
        { key: "c", label: "C", cost: 0 },
      ])
    ).toBe(17000);
  });
  it("the default catalog starts at zero", () => {
    expect(sumLineItems(DEFAULT_REPAIR_CATALOG)).toBe(0);
  });
});

describe("withContingency", () => {
  it("adds a 10% buffer by default", () => {
    expect(withContingency(40000)).toBe(44000);
  });
  it("respects a custom percentage", () => {
    expect(withContingency(40000, 15)).toBe(46000);
  });
});

describe("estimateArvFromComps", () => {
  it("averages price-per-sqft and scales to subject sqft", () => {
    const result = estimateArvFromComps(
      [
        { salePrice: 300000, sqft: 1500 }, // 200/sqft
        { salePrice: 220000, sqft: 1100 }, // 200/sqft
      ],
      1400
    );
    expect(result.pricePerSqft).toBe(200);
    expect(result.arv).toBe(280000);
    expect(result.sampleSize).toBe(2);
  });
  it("ignores comps missing price or sqft", () => {
    const result = estimateArvFromComps(
      [
        { salePrice: 300000, sqft: 1500 },
        { salePrice: null, sqft: 1200 },
        { salePrice: 250000, sqft: null },
      ],
      1500
    );
    expect(result.sampleSize).toBe(1);
    expect(result.arv).toBe(300000);
  });
  it("returns zeros when there is no usable data", () => {
    expect(estimateArvFromComps([], 1500).arv).toBe(0);
  });
});

describe("computeFinancing", () => {
  it("computes interest-only carry and points", () => {
    const result = computeFinancing({
      loanAmount: 200000,
      annualRatePct: 12,
      points: 2,
      monthlyTaxes: 300,
      monthlyInsurance: 100,
      monthlyUtilities: 150,
    });
    // 200000 * 12% / 12 = 2000 interest
    expect(result.monthlyInterest).toBe(2000);
    // + 300 + 100 + 150 = 2550 carry
    expect(result.monthlyCarry).toBe(2550);
    // 2 points on 200000 = 4000
    expect(result.pointsCost).toBe(4000);
  });
});

describe("buildSensitivityGrid", () => {
  const base: AnalysisInputs = {
    purchasePrice: 150000,
    estimatedArv: 300000,
    estimatedRepairs: 40000,
    holdingMonths: 6,
    financingCost: 1500,
    sellingCostPct: 7,
    closingCostEstimate: 4000,
  };

  it("produces a grid sized by the deltas", () => {
    const grid = buildSensitivityGrid(base, [-0.1, 0, 0.1], [-0.2, 0, 0.2]);
    expect(grid).toHaveLength(3);
    expect(grid[0]).toHaveLength(3);
  });

  it("higher ARV yields higher profit", () => {
    const grid = buildSensitivityGrid(base, [0, 0.1], [0]);
    expect(grid[1][0].profit).toBeGreaterThan(grid[0][0].profit);
  });

  it("center cell matches the base case", () => {
    const grid = buildSensitivityGrid(base, [0], [0]);
    expect(grid[0][0].arv).toBe(300000);
    expect(grid[0][0].repairs).toBe(40000);
  });
});
