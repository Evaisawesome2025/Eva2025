"use client";

import * as React from "react";
import { ChevronDown, Banknote, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, cn } from "@/lib/utils";
import { computeFinancing, type HardMoneyTerms } from "@/lib/calculators";

const FIELDS: { key: keyof HardMoneyTerms; label: string; step?: number }[] = [
  { key: "loanAmount", label: "Loan amount ($)", step: 1000 },
  { key: "annualRatePct", label: "Interest rate (%)", step: 0.25 },
  { key: "points", label: "Lender points", step: 0.5 },
  { key: "monthlyTaxes", label: "Taxes ($/mo)", step: 25 },
  { key: "monthlyInsurance", label: "Insurance ($/mo)", step: 25 },
  { key: "monthlyUtilities", label: "Utilities ($/mo)", step: 25 },
];

const DEFAULTS: HardMoneyTerms = {
  loanAmount: 0,
  annualRatePct: 11,
  points: 2,
  monthlyTaxes: 0,
  monthlyInsurance: 0,
  monthlyUtilities: 0,
};

/** Hard-money loan calculator that produces the monthly carry for the flip. */
export function FinancingCalculator({
  onApply,
}: {
  onApply: (monthlyCarry: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [terms, setTerms] = React.useState<HardMoneyTerms>(DEFAULTS);
  const [applied, setApplied] = React.useState(false);

  const result = computeFinancing(terms);

  function update(key: keyof HardMoneyTerms, value: number) {
    setTerms((prev) => ({ ...prev, [key]: value }));
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
          <Banknote className="size-4 text-primary" />
          Financing Calculator
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          {formatCurrency(result.monthlyCarry)}/mo
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={`fin-${f.key}`} className="text-xs">
                  {f.label}
                </Label>
                <Input
                  id={`fin-${f.key}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={f.step ?? 1}
                  value={terms[f.key] === 0 ? "" : terms[f.key]}
                  placeholder="0"
                  onChange={(e) => update(f.key, Number(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t pt-3 text-sm">
            <div>
              <div className="text-muted-foreground">Points cost (upfront)</div>
              <div className="font-semibold">
                {formatCurrency(result.pointsCost)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Interest only</div>
              <div className="font-semibold">
                {formatCurrency(result.monthlyInterest)}/mo
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Full carry</div>
              <div className="text-lg font-semibold">
                {formatCurrency(result.monthlyCarry)}/mo
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="ml-auto"
              onClick={() => {
                onApply(result.monthlyCarry);
                setApplied(true);
              }}
            >
              {applied ? <Check /> : null}
              {applied ? "Applied" : "Use as financing cost"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
