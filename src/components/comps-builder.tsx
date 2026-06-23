"use client";

import * as React from "react";
import {
  ChevronDown,
  Building2,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import { pricePerSqftStats } from "@/lib/calculators";
import { assessComp } from "@/lib/comp-analysis";

interface CompRow {
  id: string;
  address: string;
  salePrice: number;
  sqft: number;
  monthsAgo: number;
}

let nextId = 1;
const blank = (): CompRow => ({
  id: `c${nextId++}`,
  address: "",
  salePrice: 0,
  sqft: 0,
  monthsAgo: 0,
});

/**
 * Build ARV from your own comparable sales — no paid API, no scraping. Enter a
 * few recent nearby sales (from public records, your agent, or your research)
 * and the app derives the median $/sqft.
 */
export function CompsBuilder({
  subjectSqft,
  onPpsf,
}: {
  subjectSqft: number;
  onPpsf: (ppsf: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState<CompRow[]>([blank(), blank(), blank()]);
  const [applied, setApplied] = React.useState(false);

  const stats = pricePerSqftStats(rows);
  const ppsf = stats.median;
  const impliedArv = ppsf > 0 && subjectSqft > 0 ? ppsf * subjectSqft : 0;
  const arvLow = subjectSqft > 0 ? stats.low * subjectSqft : 0;
  const arvHigh = subjectSqft > 0 ? stats.high * subjectSqft : 0;
  const usableCount = stats.count;

  function update(id: string, field: keyof CompRow, value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]: field === "address" ? value : Number(value) || 0,
            }
          : r
      )
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
          <Building2 className="size-4 text-primary" />
          Comps Builder
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          {ppsf > 0 ? `$${ppsf}/sqft` : "add comps"}
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t p-4">
          <div className="hidden grid-cols-[1fr_110px_80px_90px_36px] gap-2 text-xs text-muted-foreground sm:grid">
            <span>Comp address (optional)</span>
            <span>Sale price</span>
            <span>Sqft</span>
            <span>Sold (mo)</span>
            <span />
          </div>
          {rows.map((r) => {
            const flags = assessComp({
              saleMonthsAgo: r.monthsAgo > 0 ? r.monthsAgo : null,
              compSqft: r.sqft > 0 ? r.sqft : null,
              subjectSqft: subjectSqft > 0 ? subjectSqft : null,
            });
            const issues = [
              flags.stale && "stale (>9mo)",
              flags.sizeMismatch && "size mismatch",
            ].filter(Boolean) as string[];
            return (
              <div key={r.id} className="space-y-1">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_110px_80px_90px_36px]">
                  <Input
                    className="col-span-2 sm:col-span-1"
                    placeholder="123 Elm St"
                    value={r.address}
                    onChange={(e) => update(r.id, "address", e.target.value)}
                  />
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="Price"
                    value={r.salePrice === 0 ? "" : r.salePrice}
                    onChange={(e) => update(r.id, "salePrice", e.target.value)}
                  />
                  <Input
                    type="number"
                    min={0}
                    step={50}
                    placeholder="Sqft"
                    value={r.sqft === 0 ? "" : r.sqft}
                    onChange={(e) => update(r.id, "sqft", e.target.value)}
                  />
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="mo"
                    value={r.monthsAgo === 0 ? "" : r.monthsAgo}
                    onChange={(e) => update(r.id, "monthsAgo", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() =>
                      setRows((prev) =>
                        prev.length > 1
                          ? prev.filter((x) => x.id !== r.id)
                          : prev
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {issues.length > 0 && r.salePrice > 0 && r.sqft > 0 && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <AlertTriangle className="size-3" />
                    Weak comp: {issues.join(", ")}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((prev) => [...prev, blank()])}
            >
              <Plus />
              Add comp
            </Button>
            <div className="text-sm text-muted-foreground">
              {usableCount} comp{usableCount === 1 ? "" : "s"} · median{" "}
              <span className="font-semibold text-foreground">
                {ppsf > 0 ? `$${ppsf}/sqft` : "—"}
              </span>
              {usableCount > 1 && (
                <span className="text-xs">
                  {" "}
                  (range ${stats.low}–${stats.high})
                </span>
              )}
              {impliedArv > 0 && (
                <>
                  {" "}
                  · ARV{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(impliedArv)}
                  </span>
                  {arvHigh > arvLow && (
                    <span className="text-xs">
                      {" "}
                      ({formatCurrency(arvLow)}–{formatCurrency(arvHigh)})
                    </span>
                  )}
                </>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              className="ml-auto"
              disabled={ppsf <= 0}
              onClick={() => {
                onPpsf(ppsf);
                setApplied(true);
              }}
            >
              {applied ? <Check /> : null}
              {applied ? "Applied" : "Use these comps"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
