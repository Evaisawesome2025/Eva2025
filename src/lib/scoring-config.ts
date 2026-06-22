// User-tunable scoring assumptions. Defaults match the classic flip rules;
// the Settings page lets each investor adjust them to their buy box.

export interface ScoringConfig {
  /** ARV multiplier for the max-offer rule (0.70 = the 70% rule). */
  arvMultiplier: number;
  /** Cash-on-cash ROI that maxes out the ROI component of the score (%). */
  targetRoiPct: number;
  /** Profit-to-ARV margin that maxes out the margin component (%). */
  targetMarginPct: number;
  /** Flip score at/above which a deal is "green". */
  greenThreshold: number;
  /** Flip score at/above which a deal is "yellow" (else "red"). */
  yellowThreshold: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  arvMultiplier: 0.7,
  targetRoiPct: 30,
  targetMarginPct: 25,
  greenThreshold: 70,
  yellowThreshold: 45,
};

const STORAGE_KEY = "flip-radar.scoring-config";

/** Merge partial/unknown stored config with defaults (forward-compatible). */
export function normalizeConfig(
  partial: Partial<ScoringConfig> | null | undefined
): ScoringConfig {
  return { ...DEFAULT_SCORING_CONFIG, ...(partial ?? {}) };
}

/** Load the user's saved assumptions from localStorage (client only). */
export function loadLocalConfig(): ScoringConfig {
  if (typeof window === "undefined") return DEFAULT_SCORING_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeConfig(JSON.parse(raw)) : DEFAULT_SCORING_CONFIG;
  } catch {
    return DEFAULT_SCORING_CONFIG;
  }
}

export function saveLocalConfig(config: ScoringConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}
