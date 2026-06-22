import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SourceRow {
  key: string;
  name: string;
  category: string;
  envVar: string;
  enabled: boolean;
}

// Reflects the data_sources registry. `enabled` is derived from whether the
// matching env var is present at build/runtime.
const DATA_SOURCES: SourceRow[] = [
  {
    key: "google_geocoding",
    name: "Google Geocoding & Places",
    category: "Geocoding",
    envVar: "GOOGLE_GEOCODING_API_KEY",
    enabled: Boolean(process.env.GOOGLE_GEOCODING_API_KEY),
  },
  {
    key: "rentcast",
    name: "RentCast",
    category: "Valuation & Comps",
    envVar: "RENTCAST_API_KEY",
    enabled: Boolean(process.env.RENTCAST_API_KEY),
  },
  {
    key: "attom",
    name: "ATTOM Data",
    category: "Public Records",
    envVar: "ATTOM_API_KEY",
    enabled: Boolean(process.env.ATTOM_API_KEY),
  },
  {
    key: "county_gis",
    name: "County GIS / Open Data",
    category: "Public Records",
    envVar: "COUNTY_GIS_BASE_URL",
    enabled: Boolean(process.env.COUNTY_GIS_BASE_URL),
  },
  {
    key: "mls_idx",
    name: "Broker MLS / IDX Feed",
    category: "Comps (Licensed)",
    envVar: "MLS_IDX_BASE_URL",
    enabled: Boolean(process.env.MLS_IDX_BASE_URL),
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage data sources and scoring assumptions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>
            Add API keys via environment variables. Status reflects whether each
            key is configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DATA_SOURCES.map((s) => (
            <div
              key={s.key}
              className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">
                  {s.category} ·{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    {s.envVar}
                  </code>
                </div>
              </div>
              {s.enabled ? (
                <Badge variant="green" className="gap-1">
                  <CheckCircle2 className="size-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="size-3" /> Not configured
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-green-600" />
            Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            This dashboard only integrates data from sources that permit
            programmatic access — RentCast, ATTOM, public county GIS/assessor
            records, and licensed broker MLS/IDX feeds. It does{" "}
            <strong>not</strong> scrape Zillow, Realtor.com, Redfin, Facebook
            Marketplace, or any site that disallows it.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scoring Assumptions</CardTitle>
          <CardDescription>
            Defaults used by the flip score. Edit{" "}
            <code className="text-xs">dealScoringService.ts</code> to tune.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">ARV rule multiplier</div>
            <div className="text-lg font-semibold">70%</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">Target cash-on-cash ROI</div>
            <div className="text-lg font-semibold">30%</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">Green verdict threshold</div>
            <div className="text-lg font-semibold">Score ≥ 70</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
