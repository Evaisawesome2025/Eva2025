"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
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
import { analyzeDeal } from "@/services/dealScoringService";
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
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Live recompute on every keystroke — fast decision making.
  const result = React.useMemo(() => analyzeDeal(inputs), [inputs]);

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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deal Inputs</CardTitle>
            <CardDescription>Enter your numbers — results update live.</CardDescription>
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
      </div>

      {/* Results — sticky so the verdict stays visible while scrolling inputs */}
      <div className="lg:col-span-2">
        <div className="space-y-4 lg:sticky lg:top-20">
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
