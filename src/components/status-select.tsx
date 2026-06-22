"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "watching", label: "Watching" },
  { value: "pursuing", label: "Pursuing" },
  { value: "offer_made", label: "Offer Made" },
  { value: "under_contract", label: "Under Contract" },
  { value: "passed", label: "Passed" },
];

export function StatusSelect({
  dealId,
  current,
}: {
  dealId: string;
  current: string;
}) {
  const [status, setStatus] = React.useState(current);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(false);

  async function update(next: string) {
    const prev = status;
    setStatus(next);
    setSaving(true);
    setError(false);
    try {
      const res = await fetch(`/api/saved-deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setStatus(prev); // revert on failure
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        disabled={saving}
        onChange={(e) => update(e.target.value)}
        className={cn(
          "h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
          error && "border-destructive"
        )}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-destructive">Couldn&apos;t save</span>
      )}
    </div>
  );
}
