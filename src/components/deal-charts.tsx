import { cn } from "@/lib/utils";
import type { DealSummary } from "@/lib/data";

const STATUS_LABELS: Record<string, string> = {
  watching: "Watching",
  pursuing: "Pursuing",
  offer_made: "Offer Made",
  under_contract: "Under Contract",
  passed: "Passed",
};

/** Compact, dependency-free charts for the dashboard. */
export function DealCharts({ deals }: { deals: DealSummary[] }) {
  const total = deals.length || 1;

  const verdicts = {
    green: deals.filter((d) => d.verdict === "green").length,
    yellow: deals.filter((d) => d.verdict === "yellow").length,
    red: deals.filter((d) => d.verdict === "red").length,
  };

  const statusCounts = Object.keys(STATUS_LABELS).map((key) => ({
    key,
    label: STATUS_LABELS[key],
    count: deals.filter((d) => d.status === key).length,
  }));
  const maxStatus = Math.max(1, ...statusCounts.map((s) => s.count));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Verdict mix — segmented bar */}
      <div className="rounded-lg border p-4">
        <div className="mb-3 text-sm font-medium">Verdict Mix</div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="bg-green-500"
            style={{ width: `${(verdicts.green / total) * 100}%` }}
          />
          <div
            className="bg-yellow-500"
            style={{ width: `${(verdicts.yellow / total) * 100}%` }}
          />
          <div
            className="bg-red-500"
            style={{ width: `${(verdicts.red / total) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-xs">
          <Legend color="bg-green-500" label="Strong" value={verdicts.green} />
          <Legend color="bg-yellow-500" label="Caution" value={verdicts.yellow} />
          <Legend color="bg-red-500" label="Pass" value={verdicts.red} />
        </div>
      </div>

      {/* Pipeline by status — horizontal bars */}
      <div className="rounded-lg border p-4">
        <div className="mb-3 text-sm font-medium">Pipeline by Status</div>
        <div className="space-y-2">
          {statusCounts.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-xs">
              <span className="w-24 shrink-0 text-muted-foreground">
                {s.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(s.count / maxStatus) * 100}%` }}
                />
              </div>
              <span className="w-4 text-right tabular-nums">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("size-2 rounded-full", color)} />
      {label} · {value}
    </span>
  );
}
