import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/verdict-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotesPanel } from "@/components/notes-panel";
import { CompsPanel } from "@/components/comps-panel";
import { StatusSelect } from "@/components/status-select";
import { formatCurrency, cn } from "@/lib/utils";
import { getDealDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const deal = await getDealDetail(params.id);
  if (!deal) notFound();

  const verdictColor =
    deal.verdict === "green"
      ? "text-green-600"
      : deal.verdict === "yellow"
        ? "text-yellow-600"
        : "text-red-600";

  const financials = [
    { label: "Purchase Price", value: deal.purchasePrice },
    { label: "Estimated ARV", value: deal.estimatedArv },
    { label: "Estimated Repairs", value: deal.estimatedRepairs },
    { label: "Max Offer (70% rule)", value: deal.maxOffer },
    { label: "Estimated Profit", value: deal.estimatedProfit },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/saved">
            <ArrowLeft />
            Back
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/properties/${deal.id}/print`}>
            <FileText />
            Deal Sheet
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <MapPin className="size-5 text-primary" />
            {deal.formattedAddress}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {deal.city}
            {deal.city && deal.state ? ", " : ""}
            {deal.state} · {deal.county}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("text-3xl font-bold tabular-nums", verdictColor)}>
            {deal.flipScore}
          </div>
          <VerdictBadge verdict={deal.verdict} />
        </div>
      </div>

      <Tabs defaultValue="analysis">
        <TabsList>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="comps">Comparables</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Flip Underwrite</CardTitle>
                <CardDescription>Pipeline status</CardDescription>
              </div>
              <StatusSelect dealId={deal.id} current={deal.status} />
            </CardHeader>
            <CardContent className="divide-y p-0">
              {financials.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <span className="text-sm font-medium">{f.label}</span>
                  <span
                    className={cn(
                      "text-lg font-semibold tabular-nums",
                      f.label === "Estimated Profit" &&
                        (f.value >= 0 ? "text-green-600" : "text-red-600")
                    )}
                  >
                    {formatCurrency(f.value)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comps">
          <Card>
            <CardHeader>
              <CardTitle>Comparable Sales</CardTitle>
              <CardDescription>
                Pulled only from approved providers (RentCast, ATTOM, county GIS,
                or a licensed MLS/IDX feed). No third-party scraping.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompsPanel
                propertyId={deal.propertyId}
                address={deal.formattedAddress}
                initialComps={deal.comps}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                Walkthrough notes, contractor bids, and reminders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotesPanel
                propertyId={deal.propertyId}
                initialNotes={deal.notes}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
