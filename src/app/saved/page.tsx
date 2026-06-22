import Link from "next/link";
import { Bookmark } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerdictBadge } from "@/components/verdict-badge";
import { formatCurrency } from "@/lib/utils";
import { listDeals } from "@/lib/data";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  watching: "Watching",
  pursuing: "Pursuing",
  offer_made: "Offer Made",
  under_contract: "Under Contract",
  passed: "Passed",
};

export default async function SavedDealsPage() {
  const { deals } = await listDeals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Deals</h1>
        <p className="text-muted-foreground">
          Everything you&apos;re tracking, sorted by flip score.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="size-5" />
            Pipeline
          </CardTitle>
          <CardDescription>
            Sample data — saved analyses appear here once Supabase is connected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {deals.length === 0 && (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nothing saved yet. Analyze a property and save it to start your
              pipeline.
            </div>
          )}
          {[...deals]
            .sort((a, b) => b.flipScore - a.flipScore)
            .map((d) => (
              <Link
                key={d.id}
                href={`/properties/${d.id}`}
                className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {d.formattedAddress}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Buy {formatCurrency(d.purchasePrice)} · ARV{" "}
                    {formatCurrency(d.estimatedArv)} · Profit{" "}
                    {formatCurrency(d.estimatedProfit)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold tabular-nums">
                    {d.flipScore}
                  </span>
                  <VerdictBadge verdict={d.verdict} />
                  <Badge variant="secondary">{STATUS_LABELS[d.status]}</Badge>
                </div>
              </Link>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
