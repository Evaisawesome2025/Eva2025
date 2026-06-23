"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { DealNote } from "@/lib/data";

export function NotesPanel({
  propertyId,
  initialNotes,
}: {
  propertyId: string;
  initialNotes: DealNote[];
}) {
  const { toast } = useToast();
  const [notes, setNotes] = React.useState<DealNote[]>(initialNotes);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function addNote() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, body: draft.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save note.");
      }
      const note: DealNote = await res.json();
      setNotes((prev) => [note, ...prev]);
      setDraft("");
      toast({ title: "Note added", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't add note",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Walkthrough notes, contractor bids, reminders…"
        />
        <Button onClick={addNote} disabled={saving || !draft.trim()} size="sm">
          {saving ? <Loader2 className="animate-spin" /> : <Plus />}
          Add note
        </Button>
      </div>

      <div className="space-y-2">
        {notes.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No notes yet.
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-md border p-3 text-sm">
              <p className="whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">{n.createdAt}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
