"use client";

import * as React from "react";
import { ChevronDown, Hammer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, cn } from "@/lib/utils";
import {
  DEFAULT_REPAIR_CATALOG,
  sumLineItems,
  withContingency,
  type RepairLineItem,
} from "@/lib/calculators";

/** Collapsible line-item rehab budget that feeds the "repairs" field. */
// Typical per-line budgets for a ~1,400 sqft Sioux Falls SFR.
const PRESETS: Record<string, Record<string, number>> = {
  Cosmetic: { paint: 4000, flooring: 6000, landscaping: 1500, permits: 500 },
  Moderate: {
    kitchen: 12000,
    bathrooms: 6000,
    flooring: 8000,
    paint: 5000,
    hvac: 5000,
    landscaping: 2000,
    permits: 1500,
  },
  Gut: {
    roof: 12000,
    hvac: 8000,
    kitchen: 20000,
    bathrooms: 12000,
    flooring: 12000,
    paint: 7000,
    windows: 8000,
    electrical: 8000,
    plumbing: 8000,
    foundation: 5000,
    landscaping: 3000,
    permits: 3000,
  },
};

export function RepairEstimator({
  onApply,
}: {
  onApply: (total: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<RepairLineItem[]>(
    DEFAULT_REPAIR_CATALOG.map((i) => ({ ...i }))
  );
  const [contingency, setContingency] = React.useState(10);
  const [applied, setApplied] = React.useState(false);

  const base = sumLineItems(items);
  const total = withContingency(base, contingency);

  function applyPreset(name: string) {
    const preset = PRESETS[name];
    setItems((prev) =>
      prev.map((i) => ({ ...i, cost: preset[i.key] ?? 0 }))
    );
    setApplied(false);
  }

  function update(key: string, cost: number) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, cost } : i))
    );
    setApplied(false);
  }

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="flex items-center gap-2 font-medium">
          <Hammer className="size-4 text-primary" />
          Repair Estimator
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          {formatCurrency(total)}
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Quick presets:</span>
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => applyPreset(name)}
                className="rounded-full border px-3 py-1 text-xs transition-colors hover:bg-accent"
              >
                {name}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.key} className="space-y-1">
                <Label htmlFor={`rep-${item.key}`} className="text-xs">
                  {item.label}
                </Label>
                <Input
                  id={`rep-${item.key}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={500}
                  value={item.cost === 0 ? "" : item.cost}
                  placeholder="0"
                  onChange={(e) =>
                    update(item.key, Number(e.target.value) || 0)
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t pt-3">
            <div className="space-y-1">
              <Label htmlFor="contingency" className="text-xs">
                Contingency (%)
              </Label>
              <Input
                id="contingency"
                type="number"
                min={0}
                step={1}
                value={contingency}
                onChange={(e) => setContingency(Number(e.target.value) || 0)}
                className="w-24"
              />
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">
                Subtotal {formatCurrency(base)} · +{contingency}% buffer
              </div>
              <div className="text-lg font-semibold">
                Total {formatCurrency(total)}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="ml-auto"
              onClick={() => {
                onApply(total);
                setApplied(true);
              }}
            >
              {applied ? <Check /> : null}
              {applied ? "Applied" : "Use as repairs"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
