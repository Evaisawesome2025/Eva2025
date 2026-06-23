import Link from "next/link";
import { Calculator, TrendingUp, Bookmark, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/verdict-badge";
import { Badge } from "@/components/ui/badge";
import { DealCharts } from "@/components/deal-charts";
import { DemoBanner } from "@/components/demo-banner";
import { formatCurrency } from "@/lib/utils";
import { listDeals } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { deals, isSample } = await listDeals();
  const greenCount = deals.filter((d) => d.verdict === "green").length;
  const avgScore =
    deals.length > 0
      ? Math.round(deals.reduce((s, d) => s + d.flipScore, 0) / deals.length)
      : 0;
  const pipelineProfit = deals
    .filter((d) => d.status !== "passed")
    .reduce((s, d) => s + d.estimatedProfit, 0);

  const stats = [
    { label: "Tracked Deals", value: deals.length.toString(), icon: Bookmark },
    { label: "Strong (Green)", value: greenCount.toString(), icon: Target },
    { label: "Avg Flip Score", value: `${avgScore}`, icon: TrendingUp },
    {
      label: "Pipeline Profit",
      value: formatCurrency(pipelineProfit),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <DemoBanner />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your Sioux Falls flip pipeline at a glance.
          </p>
        </div>
        <Button asChild>
          <Link href="/analyze">
            <Calculator />
            Analyze a Property
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="text-xl font-bold tabular-nums">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {deals.length > 0 && <DealCharts deals={deals} />}

      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
          <CardDescription>
            {isSample
              ? "Sample data — sign in with Supabase connected to see your saved deals."
              : "Your most recently updated deals."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {deals.length === 0 && (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No deals yet. Head to{" "}
              <Link href="/analyze" className="text-primary underline">
                Analyze a Property
              </Link>{" "}
              to underwrite your first flip.
            </div>
          )}
          {deals.map((d) => (
            <Link
              key={d.id}
              href={`/properties/${d.id}`}
              className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{d.formattedAddress}</div>
                <div className="text-sm text-muted-foreground">
                  {d.county} · Profit {formatCurrency(d.estimatedProfit)} · Max
                  offer {formatCurrency(d.maxOffer)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold tabular-nums">
                  {d.flipScore}
                </span>
                <VerdictBadge verdict={d.verdict} />
                <Badge variant="outline" className="capitalize">
                  {d.status.replace("_", " ")}
                </Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
