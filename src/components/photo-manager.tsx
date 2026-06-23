"use client";

import * as React from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { PHOTO_BUCKET } from "@/lib/storage";
import type { DealPhoto } from "@/lib/data";

interface PhotoView extends DealPhoto {
  url: string;
}

/**
 * Uploads property photos to Supabase Storage (private bucket, owner-scoped),
 * records metadata via /api/photos, and renders a gallery via signed URLs.
 * In demo mode (no Supabase) it explains how to enable photos.
 */
export function PhotoManager({
  propertyId,
  initialPhotos,
}: {
  propertyId: string;
  initialPhotos: DealPhoto[];
}) {
  const { toast } = useToast();
  const [photos, setPhotos] = React.useState<DealPhoto[]>(initialPhotos);
  const [views, setViews] = React.useState<PhotoView[]>([]);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const supabase = React.useMemo(
    () => (isSupabaseConfigured ? createClient() : null),
    []
  );

  // Resolve signed URLs for the current photos.
  React.useEffect(() => {
    if (!supabase || photos.length === 0) {
      setViews([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const resolved = await Promise.all(
        photos.map(async (p) => {
          const { data } = await supabase.storage
            .from(PHOTO_BUCKET)
            .createSignedUrl(p.storagePath, 3600);
          return { ...p, url: data?.signedUrl ?? "" };
        })
      );
      if (!cancelled) setViews(resolved.filter((v) => v.url));
    })();
    return () => {
      cancelled = true;
    };
  }, [photos, supabase]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to upload photos.");

      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${propertyId}/${Date.now()}-${safe}`;
      const up = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { upsert: false });
      if (up.error) throw up.error;

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, storagePath: path }),
      });
      if (!res.ok) throw new Error("Could not save photo record.");
      const photo: DealPhoto = await res.json();
      setPhotos((prev) => [photo, ...prev]);
      toast({ title: "Photo uploaded", variant: "success" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(photo: DealPhoto) {
    if (!supabase) return;
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    try {
      await supabase.storage.from(PHOTO_BUCKET).remove([photo.storagePath]);
      await fetch(`/api/photos?id=${photo.id}`, { method: "DELETE" });
    } catch {
      toast({ title: "Couldn't delete photo", variant: "error" });
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Connect Supabase (and create a private <code>property-photos</code>{" "}
        Storage bucket) to upload property photos.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onUpload}
        />
        <Button
          size="sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          Upload photo
        </Button>
      </div>

      {views.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No photos yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {views.map((v) => (
            <div key={v.id} className="group relative overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.url}
                alt={v.caption ?? "Property photo"}
                className="aspect-square w-full object-cover"
              />
              <button
                onClick={() => remove(v)}
                className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Delete photo"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
