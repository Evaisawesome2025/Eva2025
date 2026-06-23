import { describe, it, expect } from "vitest";
import { assessComp, recommendStrategy } from "./comp-analysis";

describe("assessComp", () => {
  it("flags a stale, distant, mismatched comp", () => {
    const f = assessComp({
      saleMonthsAgo: 14,
      distanceMiles: 2.5,
      compSqft: 2500,
      subjectSqft: 1500,
    });
    expect(f).toEqual({
      stale: true,
      distant: true,
      sizeMismatch: true,
      weak: true,
    });
  });

  it("passes a clean comp", () => {
    const f = assessComp({
      saleMonthsAgo: 3,
      distanceMiles: 0.4,
      compSqft: 1550,
      subjectSqft: 1500,
    });
    expect(f.weak).toBe(false);
  });

  it("ignores missing fields", () => {
    const f = assessComp({ saleMonthsAgo: null, distanceMiles: null });
    expect(f.weak).toBe(false);
  });
});

describe("recommendStrategy", () => {
  it("recommends flip when only the flip pencils", () => {
    const r = recommendStrategy({
      flipProfit: 45000,
      flipRoiPct: 28,
      monthlyCashFlow: -50,
      cashOnCashPct: 2,
    });
    expect(r.strategy).toBe("flip");
  });

  it("recommends hold when only cash flow is strong", () => {
    const r = recommendStrategy({
      flipProfit: 6000,
      flipRoiPct: 6,
      monthlyCashFlow: 400,
      cashOnCashPct: 12,
    });
    expect(r.strategy).toBe("hold");
  });

  it("recommends either when both pencil", () => {
    const r = recommendStrategy({
      flipProfit: 40000,
      flipRoiPct: 25,
      monthlyCashFlow: 300,
      cashOnCashPct: 10,
    });
    expect(r.strategy).toBe("either");
  });

  it("recommends neither when both are weak", () => {
    const r = recommendStrategy({
      flipProfit: 3000,
      flipRoiPct: 4,
      monthlyCashFlow: 20,
      cashOnCashPct: 1,
    });
    expect(r.strategy).toBe("neither");
  });
});
