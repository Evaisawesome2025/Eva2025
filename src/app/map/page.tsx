import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PipelineMap } from "@/components/pipeline-map";
import { listDeals } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const { deals } = await listDeals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline Map</h1>
        <p className="text-muted-foreground">
          Every tracked deal, color-coded by verdict.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Map</CardTitle>
          <CardDescription>
            Markers reflect each deal&apos;s flip verdict. Tap a pin for details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No deals to map yet.
            </div>
          ) : (
            <PipelineMap deals={deals} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
