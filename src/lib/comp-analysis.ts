/**
 * comp-analysis
 * -------------
 * Quality checks for comparable sales and a flip-vs-hold strategy call.
 * Pure and testable.
 */

export interface CompQualityInput {
  saleMonthsAgo?: number | null;
  distanceMiles?: number | null;
  compSqft?: number | null;
  subjectSqft?: number | null;
}

export interface CompFlags {
  stale: boolean;
  distant: boolean;
  sizeMismatch: boolean;
  /** True if any quality flag is raised. */
  weak: boolean;
}

export interface CompThresholds {
  maxMonths: number;
  maxMiles: number;
  maxSizeDeltaPct: number;
}

export const DEFAULT_COMP_THRESHOLDS: CompThresholds = {
  maxMonths: 9,
  maxMiles: 1,
  maxSizeDeltaPct: 25,
};

/** Flag a comp as stale, too far, or size-mismatched vs the subject. */
export function assessComp(
  input: CompQualityInput,
  thresholds: CompThresholds = DEFAULT_COMP_THRESHOLDS
): CompFlags {
  const stale =
    input.saleMonthsAgo != null && input.saleMonthsAgo > thresholds.maxMonths;
  const distant =
    input.distanceMiles != null && input.distanceMiles > thresholds.maxMiles;

  let sizeMismatch = false;
  if (
    input.compSqft != null &&
    input.subjectSqft != null &&
    input.subjectSqft > 0
  ) {
    const deltaPct =
      (Math.abs(input.compSqft - input.subjectSqft) / input.subjectSqft) * 100;
    sizeMismatch = deltaPct > thresholds.maxSizeDeltaPct;
  }

  return { stale, distant, sizeMismatch, weak: stale || distant || sizeMismatch };
}

// ---------------------------------------------------------------------------
// Flip vs Hold (BRRRR) strategy recommendation
// ---------------------------------------------------------------------------

export type Strategy = "flip" | "hold" | "either" | "neither";

export interface StrategyInput {
  flipProfit: number;
  flipRoiPct: number;
  monthlyCashFlow: number;
  cashOnCashPct: number;
}

export interface StrategyResult {
  strategy: Strategy;
  reason: string;
}

/** Recommend flipping vs holding (BRRRR) based on each path's returns. */
export function recommendStrategy(input: StrategyInput): StrategyResult {
  const flipGood = input.flipProfit >= 15000 && input.flipRoiPct >= 15;
  const holdGood = input.monthlyCashFlow >= 150 && input.cashOnCashPct >= 8;

  if (flipGood && holdGood) {
    return {
      strategy: "either",
      reason:
        "Both pencil — flip for fast cash, or hold for monthly cash flow + long-term equity.",
    };
  }
  if (flipGood) {
    return {
      strategy: "flip",
      reason: "Strong one-time profit; the rental cash flow is too thin to hold.",
    };
  }
  if (holdGood) {
    return {
      strategy: "hold",
      reason:
        "Cash flow is solid but flip margins are thin — better as a BRRRR/rental.",
    };
  }
  return {
    strategy: "neither",
    reason: "Neither the flip nor the hold clears typical targets at this price.",
  };
}
