import type { AnalysisInputs, AnalysisResult, Verdict } from "@/lib/types";
import {
  DEFAULT_SCORING_CONFIG,
  type ScoringConfig,
} from "@/lib/scoring-config";

/**
 * dealScoringService
 * ------------------
 * Pure, dependency-free flip math. No network, no DB — easy to unit test and
 * reuse on both client and server. Every function accepts an optional
 * ScoringConfig so investors can tune the rules to their buy box.
 */

/** The classic "70% rule" multiplier used for the max offer (default). */
export const ARV_RULE_MULTIPLIER = DEFAULT_SCORING_CONFIG.arvMultiplier;

/**
 * Max allowable offer using the ARV rule:
 *   maxOffer = ARV * multiplier - repairs   (multiplier defaults to 0.70)
 */
export function calculateMaxOffer(
  arv: number,
  repairs: number,
  multiplier: number = DEFAULT_SCORING_CONFIG.arvMultiplier
): number {
  return round(arv * multiplier - repairs);
}

/**
 * Estimated profit:
 *   profit = ARV - purchasePrice - repairs - holdingCosts - sellingCosts - closingCosts
 *
 * - holdingCosts  = financingCost * holdingMonths (financingCost is a monthly carry)
 * - sellingCosts  = ARV * sellingCostPct / 100
 */
export function calculateEstimatedProfit(inputs: AnalysisInputs): number {
  const {
    estimatedArv,
    purchasePrice,
    estimatedRepairs,
    holdingMonths,
    financingCost,
    sellingCostPct,
    closingCostEstimate,
  } = inputs;

  const holdingCosts = (financingCost || 0) * (holdingMonths || 0);
  const sellingCosts = (estimatedArv || 0) * ((sellingCostPct || 0) / 100);

  return round(
    (estimatedArv || 0) -
      (purchasePrice || 0) -
      (estimatedRepairs || 0) -
      holdingCosts -
      sellingCosts -
      (closingCostEstimate || 0)
  );
}

/** Total cash the investor has tied up (used for ROI). */
export function calculateTotalInvested(inputs: AnalysisInputs): number {
  const holdingCosts = (inputs.financingCost || 0) * (inputs.holdingMonths || 0);
  return round(
    (inputs.purchasePrice || 0) +
      (inputs.estimatedRepairs || 0) +
      holdingCosts +
      (inputs.closingCostEstimate || 0)
  );
}

/**
 * Flip score from 0–100. Blends three signals an investor cares about:
 *   1. ROI on cash invested (most weight)
 *   2. Profit margin vs. ARV
 *   3. How far the purchase price sits below the max offer (the "cushion")
 */
export function calculateFlipScore(
  inputs: AnalysisInputs,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  const profit = calculateEstimatedProfit(inputs);
  const invested = calculateTotalInvested(inputs);
  const maxOffer = calculateMaxOffer(
    inputs.estimatedArv,
    inputs.estimatedRepairs,
    config.arvMultiplier
  );

  // 1. ROI component — hitting the target cash-on-cash maxes this out.
  const roi = invested > 0 ? profit / invested : 0;
  const roiScore = clamp01(roi / (config.targetRoiPct / 100)) * 45;

  // 2. Margin component — hitting the target profit-to-ARV maxes this out.
  const margin = inputs.estimatedArv > 0 ? profit / inputs.estimatedArv : 0;
  const marginScore = clamp01(margin / (config.targetMarginPct / 100)) * 35;

  // 3. Cushion component — buying at/under the max offer is ideal.
  const cushion =
    maxOffer > 0 ? (maxOffer - inputs.purchasePrice) / maxOffer : 0;
  const cushionScore = clamp01((cushion + 0.05) / 0.2) * 20;

  const raw = roiScore + marginScore + cushionScore;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Green / yellow / red verdict derived from the flip score. */
export function scoreToVerdict(
  score: number,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): Verdict {
  if (score >= config.greenThreshold) return "green";
  if (score >= config.yellowThreshold) return "yellow";
  return "red";
}

/** Run the full underwrite and return every computed field. */
export function analyzeDeal(
  inputs: AnalysisInputs,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): AnalysisResult {
  const maxOffer = calculateMaxOffer(
    inputs.estimatedArv,
    inputs.estimatedRepairs,
    config.arvMultiplier
  );
  const estimatedProfit = calculateEstimatedProfit(inputs);
  const invested = calculateTotalInvested(inputs);
  const roiPercent = invested > 0 ? (estimatedProfit / invested) * 100 : 0;
  const flipScore = calculateFlipScore(inputs, config);
  const verdict = scoreToVerdict(flipScore, config);

  return {
    maxOffer,
    estimatedProfit,
    roiPercent: round(roiPercent),
    flipScore,
    verdict,
  };
}

// --- helpers ---
function round(n: number): number {
  return Math.round(n * 100) / 100;
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
