"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { analyzeRental, type RentalInputs } from "@/services/rentalAnalysisService";
import { recommendStrategy, type Strategy } from "@/lib/comp-analysis";

const STRATEGY_STYLE: Record<Strategy, { label: string; cls: string }> = {
  flip: { label: "Flip it", cls: "text-blue-700 dark:text-blue-400" },
  hold: { label: "Hold / BRRRR", cls: "text-green-700 dark:text-green-400" },
  either: { label: "Either works", cls: "text-foreground" },
  neither: { label: "Neither — pass", cls: "text-red-700 dark:text-red-400" },
};

/**
 * Compares the flip outcome against renting the same property (with sensible
 * default financing/expenses) and recommends the better play. Only the monthly
 * rent needs entering.
 */
export function FlipVsHold({
  purchasePrice,
  estimatedRepairs,
  closingCost,
  flipProfit,
  flipRoiPct,
}: {
  purchasePrice: number;
  estimatedRepairs: number;
  closingCost: number;
  flipProfit: number;
  flipRoiPct: number;
}) {
  const [monthlyRent, setMonthlyRent] = React.useState(0);

  const rental = React.useMemo(() => {
    const inputs: RentalInputs = {
      purchasePrice,
      estimatedRepairs,
      closingCosts: closingCost,
      monthlyRent,
      monthlyTaxes: Math.round((purchasePrice * 0.02) / 12),
      monthlyInsurance: 90,
      monthlyHoa: 0,
      vacancyPct: 5,
      managementPct: 8,
      maintenancePct: 5,
      capexPct: 5,
      downPaymentPct: 20,
      loanRatePct: 7,
      loanTermYears: 30,
    };
    return analyzeRental(inputs);
  }, [purchasePrice, estimatedRepairs, closingCost, monthlyRent]);

  const strategy = recommendStrategy({
    flipProfit,
    flipRoiPct,
    monthlyCashFlow: rental.monthlyCashFlow,
    cashOnCashPct: rental.cashOnCashPct,
  });
  const style = STRATEGY_STYLE[strategy.strategy];

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="fvh-rent">Estimated Monthly Rent ($)</Label>
        <Input
          id="fvh-rent"
          type="number"
          min={0}
          step={50}
          value={monthlyRent === 0 ? "" : monthlyRent}
          placeholder="e.g. 1800"
          onChange={(e) => setMonthlyRent(Number(e.target.value) || 0)}
        />
      </div>

      {monthlyRent > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border p-2">
              <div className="text-xs text-muted-foreground">Flip profit</div>
              <div className="font-semibold tabular-nums">
                {formatCurrency(flipProfit)}{" "}
                <span className="text-xs text-muted-foreground">
                  ({formatPercent(flipRoiPct)})
                </span>
              </div>
            </div>
            <div className="rounded-md border p-2">
              <div className="text-xs text-muted-foreground">Hold cash flow</div>
              <div
                className={cn(
                  "font-semibold tabular-nums",
                  rental.monthlyCashFlow >= 0
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {formatCurrency(rental.monthlyCashFlow)}/mo{" "}
                <span className="text-xs text-muted-foreground">
                  ({formatPercent(rental.cashOnCashPct)} CoC)
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <div className={cn("font-bold", style.cls)}>{style.label}</div>
            <p className="text-sm text-muted-foreground">{strategy.reason}</p>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Enter an estimated rent to compare flipping vs holding (uses standard
          20% down / 30-yr financing and typical operating expenses).
        </p>
      )}
    </div>
  );
}
