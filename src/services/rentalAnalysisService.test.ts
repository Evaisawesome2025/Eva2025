import { describe, it, expect } from "vitest";
import {
  analyzeRental,
  monthlyMortgagePayment,
  remainingBalance,
  projectRental,
  analyzeRefinance,
  type RentalInputs,
} from "./rentalAnalysisService";

describe("monthlyMortgagePayment", () => {
  it("amortizes a standard loan", () => {
    // $200k @ 7% / 30yr ≈ $1330.60
    const payment = monthlyMortgagePayment(200000, 7, 30);
    expect(payment).toBeGreaterThan(1330);
    expect(payment).toBeLessThan(1331);
  });
  it("handles 0% interest as straight-line", () => {
    expect(monthlyMortgagePayment(120000, 0, 10)).toBe(1000);
  });
  it("returns 0 for no principal", () => {
    expect(monthlyMortgagePayment(0, 7, 30)).toBe(0);
  });
});

describe("analyzeRental", () => {
  const inputs: RentalInputs = {
    purchasePrice: 200000,
    estimatedRepairs: 20000,
    closingCosts: 5000,
    monthlyRent: 2000,
    monthlyTaxes: 250,
    monthlyInsurance: 100,
    monthlyHoa: 0,
    vacancyPct: 5,
    managementPct: 8,
    maintenancePct: 5,
    capexPct: 5,
    downPaymentPct: 20,
    loanRatePct: 7,
    loanTermYears: 30,
  };

  it("computes NOI, cap rate, cash flow, CoC, and DSCR", () => {
    const r = analyzeRental(inputs);
    // Variable = 2000 * 23% = 460; fixed = 350; opex = 810/mo
    // NOI = (2000 - 810) * 12 = 14280
    expect(r.noi).toBe(14280);
    // Total project cost = 225000 → cap rate = 14280/225000 ≈ 6.35%
    expect(r.capRatePct).toBeCloseTo(6.35, 1);
    expect(r.monthlyDebtService).toBeGreaterThan(1000);
    expect(r.dscr).toBeGreaterThan(0);
    // Cash invested = 40000 down + 20000 repairs + 5000 closing = 65000
    expect(r.totalCashInvested).toBe(65000);
  });

  it("evaluates the 1% rule", () => {
    const r = analyzeRental(inputs);
    // rent 2000 vs 1% of 225000 = 2250 → not met
    expect(r.onePercentRuleMet).toBe(false);

    const strong = analyzeRental({ ...inputs, monthlyRent: 2600 });
    expect(strong.onePercentRuleMet).toBe(true);
  });

  it("does not divide by zero on empty inputs", () => {
    const r = analyzeRental({
      ...inputs,
      purchasePrice: 0,
      estimatedRepairs: 0,
      closingCosts: 0,
      monthlyRent: 0,
      downPaymentPct: 0,
    });
    expect(Number.isFinite(r.capRatePct)).toBe(true);
    expect(Number.isFinite(r.cashOnCashPct)).toBe(true);
    expect(r.dscr).toBe(0);
  });

  describe("remainingBalance", () => {
    it("is below principal after a year of payments", () => {
      const bal = remainingBalance(200000, 7, 30, 12);
      expect(bal).toBeLessThan(200000);
      expect(bal).toBeGreaterThan(190000);
    });
    it("is zero at the end of the term", () => {
      expect(remainingBalance(200000, 7, 30, 360)).toBe(0);
    });
  });

  describe("projectRental", () => {
    it("produces a row per year with growing equity", () => {
      const proj = projectRental(inputs, {
        years: 5,
        appreciationPct: 3,
        rentGrowthPct: 2,
      });
      expect(proj).toHaveLength(5);
      expect(proj[4].equity).toBeGreaterThan(proj[0].equity);
      expect(proj[4].propertyValue).toBeGreaterThan(proj[0].propertyValue);
      // Loan balance paid down over time.
      expect(proj[4].loanBalance).toBeLessThan(proj[0].loanBalance);
    });
    it("accumulates cash flow", () => {
      const proj = projectRental(inputs);
      expect(proj[1].cumulativeCashFlow).not.toBe(proj[0].cumulativeCashFlow);
    });
  });

  describe("analyzeRefinance (BRRRR)", () => {
    it("computes the new loan, cash-out, and capital left in", () => {
      const r = analyzeRefinance({
        arv: 300000,
        totalInvested: 200000,
        existingLoanPayoff: 150000,
        refinanceLtvPct: 75,
        refinanceClosingCosts: 5000,
      });
      // new loan = 300000 * 0.75 = 225000
      expect(r.newLoanAmount).toBe(225000);
      // cash out = 225000 - 150000 - 5000 = 70000
      expect(r.cashOut).toBe(70000);
      // capital left = 200000 - 70000 = 130000
      expect(r.capitalLeftInDeal).toBe(130000);
      // equity remaining = 300000 - 225000 = 75000
      expect(r.equityRemaining).toBe(75000);
      expect(r.infiniteReturn).toBe(false);
    });

    it("flags an infinite return when all cash is recouped", () => {
      const r = analyzeRefinance({
        arv: 320000,
        totalInvested: 180000,
        existingLoanPayoff: 120000,
        refinanceLtvPct: 75,
        refinanceClosingCosts: 6000,
      });
      // cash out = 240000 - 120000 - 6000 = 114000 < 180000 invested
      expect(r.infiniteReturn).toBe(false);

      const strong = analyzeRefinance({
        arv: 400000,
        totalInvested: 150000,
        existingLoanPayoff: 120000,
        refinanceLtvPct: 75,
        refinanceClosingCosts: 6000,
      });
      // cash out = 300000 - 120000 - 6000 = 174000 >= 150000 → infinite
      expect(strong.infiniteReturn).toBe(true);
      expect(strong.capitalLeftInDeal).toBe(0);
    });
  });
});
