"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { VerdictBadge } from "@/components/verdict-badge";
import { formatCurrency } from "@/lib/utils";
import type { DealSummary } from "@/lib/data";

const VERDICT_COLOR: Record<string, string> = {
  green: "#16a34a",
  yellow: "#ca8a04",
  red: "#dc2626",
};

// Reuse the Maps loader pattern from the autocomplete component.
let mapsPromise: Promise<void> | null = null;
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

export function PipelineMap({ deals }: { deals: DealSummary[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [ready, setReady] = React.useState(false);
  const located = deals.filter(
    (d) => d.latitude != null && d.longitude != null
  );

  React.useEffect(() => {
    if (!apiKey || located.length === 0) return;
    let map: google.maps.Map | null = null;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (!mapRef.current) return;
        const bounds = new google.maps.LatLngBounds();
        map = new google.maps.Map(mapRef.current, {
          mapTypeControl: false,
          streetViewControl: false,
        });
        located.forEach((d) => {
          const position = { lat: d.latitude!, lng: d.longitude! };
          bounds.extend(position);
          const marker = new google.maps.Marker({
            position,
            map: map!,
            title: d.formattedAddress,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: VERDICT_COLOR[d.verdict],
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          });
          const info = new google.maps.InfoWindow({
            content: `<div style="font-size:12px"><strong>${d.formattedAddress}</strong><br/>Score ${d.flipScore} · ${formatCurrency(
              d.estimatedProfit
            )}</div>`,
          });
          marker.addListener("click", () => info.open({ map: map!, anchor: marker }));
        });
        map.fitBounds(bounds);
        if (located.length === 1) map.setZoom(14);
        setReady(true);
      })
      .catch((e) => console.error(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, located.length]);

  // Fallback list (no API key, or no coordinates) — still useful.
  if (!apiKey || located.length === 0) {
    return (
      <div className="space-y-3">
        {!apiKey && (
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to render an
            interactive map. Showing a location list for now.
          </p>
        )}
        {located.length === 0 && deals.length > 0 && (
          <p className="text-sm text-muted-foreground">
            No coordinates on these deals yet.
          </p>
        )}
        {deals.map((d) => (
          <Link
            key={d.id}
            href={`/properties/${d.id}`}
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
          >
            <span className="flex items-center gap-2 text-sm">
              <MapPin
                className="size-4"
                style={{ color: VERDICT_COLOR[d.verdict] }}
              />
              {d.formattedAddress}
            </span>
            <VerdictBadge verdict={d.verdict} />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="h-[60vh] w-full overflow-hidden rounded-lg border bg-muted"
      />
      {!ready && (
        <p className="text-xs text-muted-foreground">Loading map…</p>
      )}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <Legend color={VERDICT_COLOR.green} label="Strong" />
        <Legend color={VERDICT_COLOR.yellow} label="Caution" />
        <Legend color={VERDICT_COLOR.red} label="Pass" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
