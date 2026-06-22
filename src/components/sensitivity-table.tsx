"use client";

import * as React from "react";
import { buildSensitivityGrid } from "@/lib/calculators";
import { formatCurrency, cn } from "@/lib/utils";
import type { AnalysisInputs } from "@/lib/types";

const ARV_DELTAS = [-0.1, -0.05, 0, 0.05, 0.1];
const REPAIR_DELTAS = [-0.2, 0, 0.2];

const VERDICT_BG: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
};

/** What-if grid: profit & verdict as ARV (rows) and repairs (cols) flex. */
export function SensitivityTable({ inputs }: { inputs: AnalysisInputs }) {
  const grid = React.useMemo(
    () => buildSensitivityGrid(inputs, ARV_DELTAS, REPAIR_DELTAS),
    [inputs]
  );

  if (!inputs.estimatedArv) {
    return (
      <p className="text-sm text-muted-foreground">
        Enter an ARV to see how profit holds up if the numbers move.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-center text-xs">
        <thead>
          <tr>
            <th className="p-1 text-left font-medium text-muted-foreground">
              ARV ＼ Repairs
            </th>
            {REPAIR_DELTAS.map((d, i) => (
              <th key={i} className="p-1 font-medium text-muted-foreground">
                {formatCurrency(Math.round(inputs.estimatedRepairs * (1 + d)))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, ri) => (
            <tr key={ri}>
              <td className="p-1 text-left font-medium text-muted-foreground">
                {formatCurrency(row[0].arv)}
              </td>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "rounded-md p-2 tabular-nums",
                    VERDICT_BG[cell.verdict]
                  )}
                  title={`Score ${cell.flipScore}`}
                >
                  <div className="font-semibold">
                    {formatCurrency(cell.profit)}
                  </div>
                  <div className="opacity-70">{cell.flipScore}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        Each cell shows estimated profit and flip score. Center cell is your
        base case.
      </p>
    </div>
  );
}
