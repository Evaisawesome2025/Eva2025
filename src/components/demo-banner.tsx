"use client";

import * as React from "react";
import { Info, X } from "lucide-react";

/**
 * Shown only in demo mode (Supabase not configured) to explain that data isn't
 * persisting yet and how to turn on real accounts. Dismissible per-browser.
 */
export function DemoBanner() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    if (configured) return;
    setDismissed(
      window.localStorage.getItem("flip-radar.demo-dismissed") === "1"
    );
  }, [configured]);

  if (configured || dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-50 p-3 text-sm dark:bg-blue-950/30">
      <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
      <div className="flex-1">
        <span className="font-medium">Demo mode.</span> You&apos;re seeing sample
        data and changes won&apos;t persist. To save your own deals privately,
        add Supabase env vars (
        <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
        <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,{" "}
        <code className="text-xs">DATABASE_URL</code>) and run the SQL in{" "}
        <code className="text-xs">supabase/schema.sql</code>.
      </div>
      <button
        aria-label="Dismiss"
        className="text-blue-600/70 hover:text-blue-600"
        onClick={() => {
          window.localStorage.setItem("flip-radar.demo-dismissed", "1");
          setDismissed(true);
        }}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
