"use client";

import * as React from "react";
import { Share2, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

/** Generates / revokes a public read-only deal-sheet link. */
export function ShareButton({
  dealId,
  initialToken,
}: {
  dealId: string;
  initialToken: string | null;
}) {
  const { toast } = useToast();
  const [token, setToken] = React.useState<string | null>(initialToken);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const shareUrl =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/share/${token}`
      : "";

  async function enable() {
    setBusy(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not create link.");
      setToken(data.token);
      setOpen(true);
    } catch (err) {
      toast({
        title: "Couldn't create link",
        description:
          err instanceof Error && err.message === "Not authenticated"
            ? "Sign in (connect Supabase) to share deals."
            : err instanceof Error
              ? err.message
              : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    try {
      await fetch(`/api/share?dealId=${dealId}`, { method: "DELETE" });
      setToken(null);
      setOpen(false);
      toast({ title: "Link revoked", variant: "success" });
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => (token ? setOpen((o) => !o) : enable())}
        disabled={busy}
      >
        {busy ? <Loader2 className="animate-spin" /> : <Share2 />}
        Share
      </Button>

      {open && token && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border bg-background p-3 shadow-lg">
          <p className="mb-2 text-xs text-muted-foreground">
            Anyone with this link can view a read-only deal sheet.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={shareUrl} className="text-xs" />
            <Button size="icon" variant="outline" onClick={copy}>
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
          <button
            onClick={revoke}
            className="mt-2 text-xs text-destructive hover:underline"
          >
            Revoke link
          </button>
        </div>
      )}
    </div>
  );
}
