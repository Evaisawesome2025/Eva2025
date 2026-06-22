"use client";

import * as React from "react";
import { VerdictBadge } from "@/components/verdict-badge";
import { formatCurrency, cn } from "@/lib/utils";
import type { DealSummary } from "@/lib/data";

const ROWS: {
  label: string;
  get: (d: DealSummary) => string;
  best?: "max" | "min";
  raw?: (d: DealSummary) => number;
}[] = [
  { label: "Flip Score", get: (d) => `${d.flipScore}`, best: "max", raw: (d) => d.flipScore },
  {
    label: "Estimated Profit",
    get: (d) => formatCurrency(d.estimatedProfit),
    best: "max",
    raw: (d) => d.estimatedProfit,
  },
  {
    label: "Max Offer",
    get: (d) => formatCurrency(d.maxOffer),
    best: "max",
    raw: (d) => d.maxOffer,
  },
  {
    label: "Purchase Price",
    get: (d) => formatCurrency(d.purchasePrice),
    best: "min",
    raw: (d) => d.purchasePrice,
  },
  { label: "ARV", get: (d) => formatCurrency(d.estimatedArv) },
  { label: "Repairs", get: (d) => formatCurrency(d.estimatedRepairs) },
  { label: "County", get: (d) => d.county || "—" },
  { label: "Status", get: (d) => d.status.replace("_", " ") },
];

export function DealComparison({ deals }: { deals: DealSummary[] }) {
  const [selected, setSelected] = React.useState<string[]>(
    deals.slice(0, 3).map((d) => d.id)
  );

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev
    );
  }

  const chosen = deals.filter((d) => selected.includes(d.id));

  function bestId(row: (typeof ROWS)[number]): string | null {
    if (!row.best || !row.raw || chosen.length < 2) return null;
    const vals = chosen.map((d) => ({ id: d.id, v: row.raw!(d) }));
    const pick =
      row.best === "max"
        ? vals.reduce((a, b) => (b.v > a.v ? b : a))
        : vals.reduce((a, b) => (b.v < a.v ? b : a));
    return pick.id;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {deals.map((d) => (
          <button
            key={d.id}
            onClick={() => toggle(d.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              selected.includes(d.id)
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            {d.formattedAddress.split(",")[0]}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Pick up to 4 deals to compare. Best value in each row is highlighted.
      </p>

      {chosen.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Select at least one deal above.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left font-medium text-muted-foreground">
                  Metric
                </th>
                {chosen.map((d) => (
                  <th key={d.id} className="py-2 pr-4 text-left">
                    <div className="font-medium">
                      {d.formattedAddress.split(",")[0]}
                    </div>
                    <VerdictBadge verdict={d.verdict} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const winner = bestId(row);
                return (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium text-muted-foreground">
                      {row.label}
                    </td>
                    {chosen.map((d) => (
                      <td
                        key={d.id}
                        className={cn(
                          "py-2 pr-4 tabular-nums capitalize",
                          winner === d.id && "font-semibold text-green-600"
                        )}
                      >
                        {row.get(d)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
