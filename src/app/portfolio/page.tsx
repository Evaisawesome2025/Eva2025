import Link from "next/link";
import { TrendingUp, DollarSign, Target, Layers } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerdictBadge } from "@/components/verdict-badge";
import { formatCurrency } from "@/lib/utils";
import { listDeals } from "@/lib/data";
import { summarizePortfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const { deals } = await listDeals();
  const s = summarizePortfolio(deals);

  const stats = [
    { label: "Pipeline Profit", value: formatCurrency(s.pipelineProfit), icon: TrendingUp },
    { label: "Avg Profit / Deal", value: formatCurrency(s.avgProfit), icon: DollarSign },
    { label: "Avg Flip Score", value: `${s.avgFlipScore}`, icon: Target },
    {
      label: "Capital Required",
      value: formatCurrency(s.totalCapitalRequired),
      icon: Layers,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio Analytics</h1>
        <p className="text-muted-foreground">
          Aggregate view across {s.totalDeals} tracked{" "}
          {s.totalDeals === 1 ? "deal" : "deals"}.
        </p>
      </div>

      {s.totalDeals === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No deals yet — analyze and save a property to build your portfolio.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((st) => {
              const Icon = st.icon;
              return (
                <Card key={st.label}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold tabular-nums">
                        {st.value}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {st.label}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By County</CardTitle>
                <CardDescription>Where your deals are concentrated.</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">County</th>
                      <th className="py-2 pr-4 font-medium">Deals</th>
                      <th className="py-2 pr-4 font-medium">Avg Score</th>
                      <th className="py-2 font-medium">Total Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.byCounty.map((c) => (
                      <tr key={c.county} className="border-b last:border-0">
                        <td className="py-2 pr-4">{c.county}</td>
                        <td className="py-2 pr-4 tabular-nums">{c.count}</td>
                        <td className="py-2 pr-4 tabular-nums">{c.avgScore}</td>
                        <td className="py-2 tabular-nums">
                          {formatCurrency(c.totalProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Highlights</CardTitle>
                <CardDescription>Top opportunity and totals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {s.bestDeal && (
                  <Link
                    href={`/properties/${s.bestDeal.id}`}
                    className="block rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="text-xs uppercase text-muted-foreground">
                      Best Deal
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="truncate font-medium">
                        {s.bestDeal.formattedAddress}
                      </span>
                      <VerdictBadge verdict={s.bestDeal.verdict} />
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Profit {formatCurrency(s.bestDeal.estimatedProfit)} · Score{" "}
                      {s.bestDeal.flipScore}
                    </div>
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">
                      Total ARV (all deals)
                    </div>
                    <div className="text-lg font-semibold tabular-nums">
                      {formatCurrency(s.totalArv)}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">
                      Verdict Mix
                    </div>
                    <div className="text-sm">
                      <span className="text-green-600">{s.verdictCounts.green}</span>{" "}
                      /{" "}
                      <span className="text-yellow-600">
                        {s.verdictCounts.yellow}
                      </span>{" "}
                      / <span className="text-red-600">{s.verdictCounts.red}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
