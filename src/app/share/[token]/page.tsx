import { notFound } from "next/navigation";
import { Radar } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { getSharedDeal } from "@/lib/data";

export const dynamic = "force-dynamic";

const VERDICT_LABEL: Record<string, string> = {
  green: "STRONG DEAL",
  yellow: "PROCEED WITH CAUTION",
  red: "PASS",
};

export default async function SharedDealPage({
  params,
}: {
  params: { token: string };
}) {
  const deal = await getSharedDeal(params.token);
  if (!deal) notFound();

  const rows = [
    { label: "Purchase Price", value: deal.purchasePrice },
    { label: "Estimated ARV", value: deal.estimatedArv },
    { label: "Estimated Repairs", value: deal.estimatedRepairs },
    { label: "Max Offer (70% rule)", value: deal.maxOffer },
    { label: "Estimated Profit", value: deal.estimatedProfit },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Radar className="size-4 text-primary" />
        Sioux Falls Flip Radar · Shared Deal Sheet
      </div>

      <div className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <h1 className="text-xl font-bold">{deal.formattedAddress}</h1>
            <div className="text-sm text-muted-foreground">
              {deal.city}
              {deal.city && deal.state ? ", " : ""}
              {deal.state} · {deal.county}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold tabular-nums">
              {deal.flipScore}
              <span className="text-base text-muted-foreground">/100</span>
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

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md bg-muted/50 p-4">
            <div className="text-xs uppercase text-muted-foreground">
              Max Offer
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(deal.maxOffer)}
            </div>
          </div>
          <div className="rounded-md bg-muted/50 p-4">
            <div className="text-xs uppercase text-muted-foreground">
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

        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b last:border-0">
                <td className="py-1.5 text-muted-foreground">{r.label}</td>
                <td className="py-1.5 text-right font-medium tabular-nums">
                  {formatCurrency(r.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t pt-3 text-xs text-muted-foreground">
          Estimates for decision-making, not an appraisal or offer.
        </div>
      </div>
    </div>
  );
}
