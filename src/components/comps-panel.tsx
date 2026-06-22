"use client";

import * as React from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { DealComp } from "@/lib/data";

export function CompsPanel({
  propertyId,
  address,
  initialComps,
}: {
  propertyId: string;
  address: string;
  initialComps: DealComp[];
}) {
  const [comps, setComps] = React.useState<DealComp[]>(initialComps);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/comps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, address }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Could not fetch comps.");
        return;
      }
      if (data.message) setMessage(data.message);
      if (Array.isArray(data.comps)) {
        setComps(
          data.comps.map((c: Record<string, unknown>, i: number) => ({
            id: `live-${i}`,
            ...c,
          }))
        );
      }
    } catch {
      setMessage("Could not fetch comps.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Comps from approved providers only.
        </p>
        <Button onClick={refresh} disabled={loading} size="sm" variant="outline">
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Refresh comps
        </Button>
      </div>

      {message && (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {message}
        </div>
      )}

      {comps.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No comparables yet. Add an approved data-source API key (e.g.
          RentCast) and refresh.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Address</th>
                <th className="py-2 pr-4 font-medium">Sale Price</th>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Bd/Ba</th>
                <th className="py-2 pr-4 font-medium">Sqft</th>
                <th className="py-2 font-medium">Dist.</th>
              </tr>
            </thead>
            <tbody>
              {comps.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{c.formattedAddress || "—"}</td>
                  <td className="py-2 pr-4 tabular-nums">
                    {formatCurrency(c.salePrice)}
                  </td>
                  <td className="py-2 pr-4">{c.saleDate ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {c.beds ?? "—"}/{c.baths ?? "—"}
                  </td>
                  <td className="py-2 pr-4 tabular-nums">{c.sqft ?? "—"}</td>
                  <td className="py-2 tabular-nums">
                    {c.distanceMiles != null
                      ? `${c.distanceMiles.toFixed(1)} mi`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
