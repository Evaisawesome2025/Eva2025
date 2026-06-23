"use client";

import * as React from "react";
import { Loader2, Save, Calculator } from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { VerdictBadge } from "@/components/verdict-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RepairEstimator } from "@/components/repair-estimator";
import { FinancingCalculator } from "@/components/financing-calculator";
import { SensitivityTable } from "@/components/sensitivity-table";
import { OfferScenarios } from "@/components/offer-scenarios";
import { SmartEstimate } from "@/components/smart-estimate";
import { dealEconomics } from "@/lib/calculators";
import { analyzeDeal } from "@/services/dealScoringService";
import { recommendFlip } from "@/lib/instant-analysis";
import {
  loadLocalConfig,
  DEFAULT_SCORING_CONFIG,
  type ScoringConfig,
} from "@/lib/scoring-config";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { AnalysisInputs, SelectedAddress } from "@/lib/types";

const FIELDS: {
  key: keyof AnalysisInputs;
  label: string;
  hint?: string;
  step?: string;
}[] = [
  { key: "purchasePrice", label: "Purchase Price ($)" },
  { key: "estimatedArv", label: "Estimated ARV ($)", hint: "After-repair value" },
  { key: "estimatedRepairs", label: "Estimated Repairs ($)" },
  { key: "holdingMonths", label: "Holding Months", step: "1" },
  {
    key: "financingCost",
    label: "Financing Cost ($ / month)",
    hint: "Monthly carry: loan interest, taxes, insurance, utilities",
  },
  { key: "sellingCostPct", label: "Selling Cost (%)", hint: "Agent + transfer", step: "0.1" },
  { key: "closingCostEstimate", label: "Closing Costs ($)" },
];

const DEFAULTS: AnalysisInputs = {
  purchasePrice: 0,
  estimatedArv: 0,
  estimatedRepairs: 0,
  holdingMonths: 6,
  financingCost: 0,
  sellingCostPct: 7,
  closingCostEstimate: 0,
};

const VERDICT_RING: Record<string, string> = {
  green: "text-green-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
};

export function AnalyzeForm() {
  const [address, setAddress] = React.useState<SelectedAddress | null>(null);
  const [inputs, setInputs] = React.useState<AnalysisInputs>(DEFAULTS);
  const [config, setConfig] = React.useState<ScoringConfig>(
    DEFAULT_SCORING_CONFIG
  );
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [analyzed, setAnalyzed] = React.useState(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Apply the investor's saved scoring assumptions from Settings.
  React.useEffect(() => {
    setConfig(loadLocalConfig());
  }, []);

  // Live recompute on every keystroke — fast decision making.
  const result = React.useMemo(
    () => analyzeDeal(inputs, config),
    [inputs, config]
  );
  const econ = React.useMemo(() => dealEconomics(inputs), [inputs]);
  const recommendation = React.useMemo(
    () => recommendFlip(result, inputs.purchasePrice, result.maxOffer),
    [result, inputs.purchasePrice]
  );

  const canAnalyze = Boolean(address) && inputs.estimatedArv > 0;

  function runAnalysis() {
    if (!canAnalyze) return;
    setAnalyzed(true);
    // On smaller screens the results sit below the form — bring them into view.
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  function update(key: keyof AnalysisInputs, raw: string) {
    const num = raw === "" ? 0 : Number(raw);
    setInputs((prev) => ({ ...prev, [key]: Number.isNaN(num) ? 0 : num }));
    setSaved(false);
  }

  async function handleSave() {
    if (!address) return;
    setSaving(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, inputs, result }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Inputs */}
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Property Address</CardTitle>
            <CardDescription>
              Search Google-style; we store place_id, lat/lng, city, county & more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AddressAutocomplete onSelect={setAddress} />
            {address && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <div className="font-medium">{address.formattedAddress}</div>
                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>City: {address.city || "—"}</span>
                  <span>State: {address.state || "—"}</span>
                  <span>ZIP: {address.zip || "—"}</span>
                  <span>County: {address.county || "—"}</span>
                  <span>Lat: {address.latitude?.toFixed(5) ?? "—"}</span>
                  <span>Lng: {address.longitude?.toFixed(5) ?? "—"}</span>
                </div>
              </div>
            )}
            <SmartEstimate
              address={address}
              onApply={(arv, repairs) =>
                setInputs((prev) => ({
                  ...prev,
                  estimatedArv: arv,
                  estimatedRepairs: repairs,
                }))
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deal Inputs</CardTitle>
            <CardDescription>
              Auto-filled by Smart Estimate — adjust any number to fine-tune.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  type="number"
                  inputMode="decimal"
                  step={f.step ?? "1000"}
                  min={0}
                  value={inputs[f.key] === 0 ? "" : inputs[f.key]}
                  placeholder="0"
                  onChange={(e) => update(f.key, e.target.value)}
                />
                {f.hint && (
                  <p className="text-xs text-muted-foreground">{f.hint}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Helper calculators that populate the fields above. */}
        <RepairEstimator
          onApply={(total) =>
            setInputs((prev) => ({ ...prev, estimatedRepairs: total }))
          }
        />
        <FinancingCalculator
          onApply={(carry) =>
            setInputs((prev) => ({ ...prev, financingCost: carry }))
          }
        />

        {/* Primary action */}
        <Button
          size="lg"
          className="w-full"
          disabled={!canAnalyze}
          onClick={runAnalysis}
        >
          <Calculator />
          Analyze Property
        </Button>
        {!canAnalyze && (
          <p className="text-center text-xs text-muted-foreground">
            {address
              ? "Enter an estimated ARV to analyze."
              : "Select a property address to analyze."}
          </p>
        )}
      </div>

      {/* Results — sticky so the verdict stays visible while scrolling inputs */}
      <div className="lg:col-span-2" ref={resultsRef}>
        {!analyzed ? (
          <Card className="lg:sticky lg:top-20">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-10 text-center">
              <Calculator className="size-8 text-muted-foreground" />
              <div className="font-medium">Your analysis will appear here</div>
              <p className="text-sm text-muted-foreground">
                Pick an address, enter your numbers, and hit{" "}
                <span className="font-medium">Analyze Property</span> to see the
                max offer, estimated profit, and flip score.
              </p>
            </CardContent>
          </Card>
        ) : (
        <div className="space-y-4 lg:sticky lg:top-20">
          <div
            className={cn(
              "rounded-lg border-l-4 p-4",
              recommendation.rec === "good" &&
                "border-green-500 bg-green-50 dark:bg-green-950/30",
              recommendation.rec === "maybe" &&
                "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30",
              recommendation.rec === "pass" &&
                "border-red-500 bg-red-50 dark:bg-red-950/30"
            )}
          >
            <div
              className={cn(
                "text-lg font-bold",
                recommendation.rec === "good" && "text-green-700 dark:text-green-400",
                recommendation.rec === "maybe" && "text-yellow-700 dark:text-yellow-400",
                recommendation.rec === "pass" && "text-red-700 dark:text-red-400"
              )}
            >
              {recommendation.rec === "good"
                ? "✓ Good flip"
                : recommendation.rec === "maybe"
                  ? "~ Maybe — proceed carefully"
                  : "✕ Pass on this one"}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {recommendation.reason}
            </p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Flip Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "text-5xl font-bold tabular-nums",
                    VERDICT_RING[result.verdict]
                  )}
                >
                  {result.flipScore}
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
                <VerdictBadge verdict={result.verdict} />
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    result.verdict === "green" && "bg-green-500",
                    result.verdict === "yellow" && "bg-yellow-500",
                    result.verdict === "red" && "bg-red-500"
                  )}
                  style={{ width: `${result.flipScore}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="divide-y p-0">
              <ResultRow
                label="Max Offer (70% rule)"
                hint="ARV × 0.70 − repairs"
                value={formatCurrency(result.maxOffer)}
              />
              <ResultRow
                label="Estimated Profit"
                value={formatCurrency(result.estimatedProfit)}
                emphasis={result.estimatedProfit >= 0 ? "good" : "bad"}
              />
              <ResultRow
                label="Cash-on-Cash ROI"
                value={formatPercent(result.roiPercent)}
              />
              <ResultRow
                label="Total Project Cost"
                hint="Purchase + repairs + holding + closing"
                value={formatCurrency(econ.totalProjectCost)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Offer Scenarios</CardTitle>
              <CardDescription>Max offer by ARV discipline</CardDescription>
            </CardHeader>
            <CardContent>
              <OfferScenarios
                arv={inputs.estimatedArv}
                repairs={inputs.estimatedRepairs}
                purchasePrice={inputs.purchasePrice}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sensitivity Analysis</CardTitle>
              <CardDescription>If the numbers move against you…</CardDescription>
            </CardHeader>
            <CardContent>
              <SensitivityTable inputs={inputs} />
            </CardContent>
          </Card>

          <Button
            className="w-full"
            disabled={!address || saving}
            onClick={handleSave}
          >
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save />
            )}
            {saved ? "Saved" : "Save to Deals"}
          </Button>
          {!address && (
            <p className="text-center text-xs text-muted-foreground">
              Select an address to save this analysis.
            </p>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: "good" | "bad";
}) {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div
        className={cn(
          "text-lg font-semibold tabular-nums",
          emphasis === "good" && "text-green-600",
          emphasis === "bad" && "text-red-600"
        )}
      >
        {value}
      </div>
    </div>
  );
}
