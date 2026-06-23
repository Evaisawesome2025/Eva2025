"use client";

import * as React from "react";
import { Wand2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompsBuilder } from "@/components/comps-builder";
import { formatCurrency, cn } from "@/lib/utils";
import {
  estimateArv,
  estimateRepairs,
  CONDITION_LABELS,
  DEFAULT_MARKET_PPSF,
  type Condition,
} from "@/lib/instant-analysis";
import type { SelectedAddress } from "@/lib/types";

/**
 * Auto-derives ARV and repair budget from a property's size, condition, and
 * market $/sqft — pulling real subject data + comps from an approved provider
 * when one is connected, otherwise using labeled Sioux Falls defaults.
 */
export function SmartEstimate({
  address,
  onApply,
}: {
  address: SelectedAddress | null;
  onApply: (arv: number, repairs: number) => void;
}) {
  const [sqft, setSqft] = React.useState(0);
  const [condition, setCondition] = React.useState<Condition>("medium");
  const [marketPpsf, setMarketPpsf] = React.useState(DEFAULT_MARKET_PPSF);
  const [loading, setLoading] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);
  const [applied, setApplied] = React.useState(false);

  const arv = estimateArv(marketPpsf, sqft);
  const repairs = estimateRepairs(condition, sqft);

  // Pull subject data + comps whenever a new address is selected.
  React.useEffect(() => {
    if (!address?.formattedAddress) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/property/lookup?address=${encodeURIComponent(address.formattedAddress)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.sqft) setSqft(data.sqft);
        if (data.marketPpsf) setMarketPpsf(data.marketPpsf);
        setNote(
          data.hasData
            ? `Auto-filled from ${data.sources.join(", ")}.`
            : "Using Sioux Falls market defaults — add a data provider key (RentCast/ATTOM) for live comps."
        );
        setApplied(false);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [address?.formattedAddress]);

  function apply() {
    onApply(arv, repairs);
    setApplied(true);
  }

  return (
    <div className="rounded-lg border bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Wand2 className="size-4 text-primary" />
        <span className="font-medium">Smart Estimate</span>
        {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="se-sqft" className="text-xs">
            Square Footage
          </Label>
          <Input
            id="se-sqft"
            type="number"
            min={0}
            step={50}
            value={sqft === 0 ? "" : sqft}
            placeholder="0"
            onChange={(e) => {
              setSqft(Number(e.target.value) || 0);
              setApplied(false);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="se-cond" className="text-xs">
            Condition
          </Label>
          <select
            id="se-cond"
            value={condition}
            onChange={(e) => {
              setCondition(e.target.value as Condition);
              setApplied(false);
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {(Object.keys(CONDITION_LABELS) as Condition[]).map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="se-ppsf" className="text-xs">
            Market $/sqft
          </Label>
          <Input
            id="se-ppsf"
            type="number"
            min={0}
            step={5}
            value={marketPpsf === 0 ? "" : marketPpsf}
            placeholder="0"
            onChange={(e) => {
              setMarketPpsf(Number(e.target.value) || 0);
              setApplied(false);
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span>
          Est. ARV{" "}
          <span className="font-semibold">{formatCurrency(arv)}</span>
        </span>
        <span>
          Est. Repairs{" "}
          <span className="font-semibold">{formatCurrency(repairs)}</span>
        </span>
        <Button
          type="button"
          size="sm"
          className="ml-auto"
          disabled={sqft <= 0}
          onClick={apply}
        >
          {applied ? <Check /> : <Wand2 />}
          {applied ? "Applied" : "Use these numbers"}
        </Button>
      </div>

      {note && (
        <p className={cn("mt-2 text-xs text-muted-foreground")}>{note}</p>
      )}

      <div className="mt-3">
        <CompsBuilder
          subjectSqft={sqft}
          onPpsf={(v) => {
            setMarketPpsf(v);
            setNote("Market $/sqft set from your comps.");
            setApplied(false);
          }}
        />
      </div>
    </div>
  );
}
