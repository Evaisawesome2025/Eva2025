import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DealComparison } from "@/components/deal-comparison";
import { listDeals } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const { deals } = await listDeals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compare Deals</h1>
        <p className="text-muted-foreground">
          Put your best opportunities head-to-head.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Side-by-Side</CardTitle>
          <CardDescription>
            Compare flip score, profit, and offer math across deals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No deals to compare yet.
            </div>
          ) : (
            <DealComparison deals={deals} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
