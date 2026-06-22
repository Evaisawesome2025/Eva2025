import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { formatCurrency, cn } from "@/lib/utils";
import { getDealDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

const VERDICT_LABEL: Record<string, string> = {
  green: "STRONG DEAL",
  yellow: "PROCEED WITH CAUTION",
  red: "PASS",
};

export default async function DealSheetPage({
  params,
}: {
  params: { id: string };
}) {
  const deal = await getDealDetail(params.id);
  if (!deal) notFound();

  const rows = [
    { label: "Purchase Price", value: deal.purchasePrice },
    { label: "Estimated ARV", value: deal.estimatedArv },
    { label: "Estimated Repairs", value: deal.estimatedRepairs },
    { label: "Holding Months", value: deal.holdingMonths, plain: true },
    { label: "Financing Cost / mo", value: deal.financingCost },
    { label: "Selling Cost %", value: deal.sellingCostPct, plain: true },
    { label: "Closing Costs", value: deal.closingCostEstimate },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Screen-only controls */}
      <div className="no-print flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/properties/${deal.id}`}>
            <ArrowLeft />
            Back
          </Link>
        </Button>
        <PrintButton label="Print / Save PDF" />
      </div>

      {/* The deal sheet */}
      <div className="space-y-6 rounded-lg border bg-white p-8 text-black print:border-0 print:p-0">
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Sioux Falls Flip Radar · Deal Sheet
            </div>
            <h1 className="mt-1 text-xl font-bold">{deal.formattedAddress}</h1>
            <div className="text-sm text-gray-600">
              {deal.city}
              {deal.city && deal.state ? ", " : ""}
              {deal.state} · {deal.county}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold tabular-nums">
              {deal.flipScore}
              <span className="text-base text-gray-400">/100</span>
            </div>
            <div
              className={cn(
                "mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold",
                deal.verdict === "green" && "bg-green-100 text-green-800",
                deal.verdict === "yellow" && "bg-yellow-100 text-yellow-800",
                deal.verdict === "red" && "bg-red-100 text-red-800"
              )}
            >
              {VERDICT_LABEL[deal.verdict]}
            </div>
          </div>
        </div>

        {/* Headline numbers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md bg-gray-50 p-4">
            <div className="text-xs uppercase text-gray-500">
              Max Offer (70% rule)
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(deal.maxOffer)}
            </div>
          </div>
          <div className="rounded-md bg-gray-50 p-4">
            <div className="text-xs uppercase text-gray-500">
              Estimated Profit
            </div>
            <div
              className={cn(
                "text-2xl font-bold tabular-nums",
                deal.estimatedProfit >= 0 ? "text-green-700" : "text-red-700"
              )}
            >
              {formatCurrency(deal.estimatedProfit)}
            </div>
          </div>
        </div>

        {/* Inputs table */}
        <div>
          <div className="mb-2 text-sm font-semibold">Underwrite</div>
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b last:border-0">
                  <td className="py-1.5 text-gray-600">{r.label}</td>
                  <td className="py-1.5 text-right font-medium tabular-nums">
                    {r.value == null
                      ? "—"
                      : r.plain
                        ? r.value
                        : formatCurrency(r.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {deal.notes.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-semibold">Notes</div>
            <ul className="space-y-1 text-sm text-gray-700">
              {deal.notes.map((n) => (
                <li key={n.id} className="border-b pb-1 last:border-0">
                  {n.body}{" "}
                  <span className="text-xs text-gray-400">({n.createdAt})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t pt-3 text-xs text-gray-400">
          Generated by Sioux Falls Flip Radar. Figures are estimates for
          decision-making, not an appraisal or offer.
        </div>
      </div>
    </div>
  );
}
