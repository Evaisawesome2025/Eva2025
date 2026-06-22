"use client";

import { offerScenarios } from "@/lib/calculators";
import { formatCurrency, cn } from "@/lib/utils";

/** Max offer under conservative / standard / aggressive ARV disciplines. */
export function OfferScenarios({
  arv,
  repairs,
  purchasePrice,
}: {
  arv: number;
  repairs: number;
  purchasePrice: number;
}) {
  const scenarios = offerScenarios(arv, repairs);

  if (!arv) {
    return (
      <p className="text-sm text-muted-foreground">
        Enter an ARV to see your offer range.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {scenarios.map((s) => {
        // Flag whether your purchase price fits under this discipline.
        const fits = purchasePrice > 0 && purchasePrice <= s.maxOffer;
        return (
          <div
            key={s.label}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">{s.label}</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                purchasePrice > 0 && (fits ? "text-green-600" : "text-red-600")
              )}
            >
              {formatCurrency(s.maxOffer)}
            </span>
          </div>
        );
      })}
      {purchasePrice > 0 && (
        <p className="text-xs text-muted-foreground">
          Green = your purchase price fits under that rule.
        </p>
      )}
    </div>
  );
}
