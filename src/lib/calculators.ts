import type { AnalysisInputs, Verdict } from "@/lib/types";
import { analyzeDeal } from "@/services/dealScoringService";

// ---------------------------------------------------------------------------
// Repair estimator — line-item rehab budgeting.
// ---------------------------------------------------------------------------

export interface RepairLineItem {
  key: string;
  label: string;
  cost: number;
}

/** A sensible default rehab catalog for a Sioux Falls SFR cosmetic-to-full flip. */
export const DEFAULT_REPAIR_CATALOG: RepairLineItem[] = [
  { key: "roof", label: "Roof", cost: 0 },
  { key: "hvac", label: "HVAC / furnace", cost: 0 },
  { key: "kitchen", label: "Kitchen", cost: 0 },
  { key: "bathrooms", label: "Bathroom(s)", cost: 0 },
  { key: "flooring", label: "Flooring", cost: 0 },
  { key: "paint", label: "Interior/exterior paint", cost: 0 },
  { key: "windows", label: "Windows / doors", cost: 0 },
  { key: "electrical", label: "Electrical", cost: 0 },
  { key: "plumbing", label: "Plumbing", cost: 0 },
  { key: "foundation", label: "Foundation / structural", cost: 0 },
  { key: "landscaping", label: "Landscaping / exterior", cost: 0 },
  { key: "permits", label: "Permits & dumpsters", cost: 0 },
];

/** Sum all line items into a total repair budget. */
export function sumLineItems(items: RepairLineItem[]): number {
  return Math.round(
    items.reduce((total, item) => total + (Number(item.cost) || 0), 0)
  );
}

/**
 * Add a contingency buffer (defaults to 10%) on top of a base repair number —
 * the buffer experienced flippers always carry.
 */
export function withContingency(base: number, pct = 10): number {
  return Math.round(base * (1 + pct / 100));
}

// ---------------------------------------------------------------------------
// ARV from comparable sales — average price-per-sqft × subject sqft.
// ---------------------------------------------------------------------------

export interface ComplikeSale {
  salePrice: number | null;
  sqft: number | null;
}

export function estimateArvFromComps(
  comps: ComplikeSale[],
  subjectSqft: number
): { pricePerSqft: number; arv: number; sampleSize: number } {
  const usable = comps.filter(
    (c) => (c.salePrice ?? 0) > 0 && (c.sqft ?? 0) > 0
  );
  if (usable.length === 0 || subjectSqft <= 0) {
    return { pricePerSqft: 0, arv: 0, sampleSize: 0 };
  }
  const avgPpsf =
    usable.reduce((sum, c) => sum + c.salePrice! / c.sqft!, 0) / usable.length;
  return {
    pricePerSqft: Math.round(avgPpsf),
    arv: Math.round(avgPpsf * subjectSqft),
    sampleSize: usable.length,
  };
}

// ---------------------------------------------------------------------------
// Hard-money / financing calculator — turns loan terms into the monthly carry
// that the flip analysis expects (interest-only is the norm for hard money).
// ---------------------------------------------------------------------------

export interface HardMoneyTerms {
  loanAmount: number;
  annualRatePct: number;
  /** Lender points charged upfront (1 point = 1% of loan). */
  points: number;
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyUtilities: number;
}

export interface FinancingBreakdown {
  /** Upfront cost of points, in dollars. */
  pointsCost: number;
  /** Interest-only monthly loan payment. */
  monthlyInterest: number;
  /** Full monthly carry (interest + taxes + insurance + utilities). */
  monthlyCarry: number;
}

export function computeFinancing(terms: HardMoneyTerms): FinancingBreakdown {
  const monthlyInterest = (terms.loanAmount * (terms.annualRatePct / 100)) / 12;
  const monthlyCarry =
    monthlyInterest +
    (terms.monthlyTaxes || 0) +
    (terms.monthlyInsurance || 0) +
    (terms.monthlyUtilities || 0);
  return {
    pointsCost: Math.round(terms.loanAmount * ((terms.points || 0) / 100)),
    monthlyInterest: Math.round(monthlyInterest),
    monthlyCarry: Math.round(monthlyCarry),
  };
}

// ---------------------------------------------------------------------------
// Sensitivity analysis — how profit & verdict move as ARV and repairs flex.
// ---------------------------------------------------------------------------

export interface SensitivityCell {
  arv: number;
  repairs: number;
  profit: number;
  flipScore: number;
  verdict: Verdict;
}

/**
 * Build a grid of outcomes by flexing ARV (rows) and repairs (cols) around the
 * base case. Deltas are fractional, e.g. [-0.05, 0, 0.05].
 */
export function buildSensitivityGrid(
  base: AnalysisInputs,
  arvDeltas: number[] = [-0.1, -0.05, 0, 0.05, 0.1],
  repairDeltas: number[] = [-0.2, 0, 0.2]
): SensitivityCell[][] {
  return arvDeltas.map((aDelta) => {
    const arv = Math.round(base.estimatedArv * (1 + aDelta));
    return repairDeltas.map((rDelta) => {
      const repairs = Math.round(base.estimatedRepairs * (1 + rDelta));
      const result = analyzeDeal({ ...base, estimatedArv: arv, estimatedRepairs: repairs });
      return {
        arv,
        repairs,
        profit: result.estimatedProfit,
        flipScore: result.flipScore,
        verdict: result.verdict,
      };
    });
  });
}
