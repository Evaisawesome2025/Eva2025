"use client";

import * as React from "react";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { analyzeRental, type RentalInputs } from "@/services/rentalAnalysisService";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { SelectedAddress } from "@/lib/types";

const FIELDS: {
  key: keyof RentalInputs;
  label: string;
  step?: number;
}[] = [
  { key: "purchasePrice", label: "Purchase Price ($)", step: 1000 },
  { key: "estimatedRepairs", label: "Repairs ($)", step: 1000 },
  { key: "closingCosts", label: "Closing Costs ($)", step: 500 },
  { key: "monthlyRent", label: "Monthly Rent ($)", step: 50 },
  { key: "monthlyTaxes", label: "Taxes ($/mo)", step: 25 },
  { key: "monthlyInsurance", label: "Insurance ($/mo)", step: 25 },
  { key: "monthlyHoa", label: "HOA ($/mo)", step: 25 },
  { key: "vacancyPct", label: "Vacancy (%)", step: 1 },
  { key: "managementPct", label: "Management (%)", step: 1 },
  { key: "maintenancePct", label: "Maintenance (%)", step: 1 },
  { key: "capexPct", label: "CapEx (%)", step: 1 },
  { key: "downPaymentPct", label: "Down Payment (%)", step: 1 },
  { key: "loanRatePct", label: "Loan Rate (%)", step: 0.125 },
  { key: "loanTermYears", label: "Loan Term (yrs)", step: 1 },
];

const DEFAULTS: RentalInputs = {
  purchasePrice: 0,
  estimatedRepairs: 0,
  closingCosts: 0,
  monthlyRent: 0,
  monthlyTaxes: 0,
  monthlyInsurance: 0,
  monthlyHoa: 0,
  vacancyPct: 5,
  managementPct: 8,
  maintenancePct: 5,
  capexPct: 5,
  downPaymentPct: 20,
  loanRatePct: 7,
  loanTermYears: 30,
};

export function RentalForm() {
  const [, setAddress] = React.useState<SelectedAddress | null>(null);
  const [inputs, setInputs] = React.useState<RentalInputs>(DEFAULTS);

  const r = React.useMemo(() => analyzeRental(inputs), [inputs]);

  function update(key: keyof RentalInputs, raw: string) {
    const num = raw === "" ? 0 : Number(raw);
    setInputs((prev) => ({ ...prev, [key]: Number.isNaN(num) ? 0 : num }));
  }

  const cashFlowGood = r.monthlyCashFlow >= 0;
  const metrics = [
    {
      label: "Monthly Cash Flow",
      value: formatCurrency(r.monthlyCashFlow),
      tone: cashFlowGood ? "good" : "bad",
    },
    { label: "Cap Rate", value: formatPercent(r.capRatePct) },
    { label: "Cash-on-Cash", value: formatPercent(r.cashOnCashPct) },
    {
      label: "DSCR",
      value: r.dscr.toFixed(2),
      tone: r.dscr >= 1.2 ? "good" : r.dscr >= 1 ? undefined : "bad",
    },
    { label: "NOI (annual)", value: formatCurrency(r.noi) },
    { label: "Debt Service", value: `${formatCurrency(r.monthlyDebtService)}/mo` },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Property Address</CardTitle>
            <CardDescription>Optional — search to tag this rental.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddressAutocomplete onSelect={setAddress} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rental Inputs</CardTitle>
            <CardDescription>
              Buy-and-hold / BRRRR underwriting — updates live.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`rent-${f.key}`}>{f.label}</Label>
                <Input
                  id={`rent-${f.key}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={f.step ?? 1}
                  value={inputs[f.key] === 0 ? "" : inputs[f.key]}
                  placeholder="0"
                  onChange={(e) => update(f.key, e.target.value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <div className="space-y-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Rental Returns</CardTitle>
              <CardDescription>
                {r.onePercentRuleMet ? (
                  <Badge variant="green">Passes the 1% rule</Badge>
                ) : (
                  <Badge variant="yellow">
                    Below 1% rule ({formatPercent(r.rentToPricePct)})
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div
                    className={cn(
                      "text-lg font-semibold tabular-nums",
                      m.tone === "good" && "text-green-600",
                      m.tone === "bad" && "text-red-600"
                    )}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-xs text-muted-foreground">
              Total cash invested {formatCurrency(r.totalCashInvested)} (down
              payment + repairs + closing). DSCR ≥ 1.2 and positive cash flow are
              typical lender / investor targets.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
