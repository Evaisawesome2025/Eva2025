"use client";

import * as React from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SelectedAddress } from "@/lib/types";

/**
 * Google-style address autocomplete.
 *
 * - With NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: uses the Google Places JS library for
 *   rich incremental suggestions.
 * - Without a key: falls back to a keyless server endpoint (/api/address/suggest,
 *   backed by the U.S. Census geocoder) so autocomplete still works out of the box.
 *
 * Either way, selecting a result emits a fully structured SelectedAddress
 * (place_id when available, lat/lng, city, state, zip, county).
 */

interface AddressAutocompleteProps {
  onSelect: (address: SelectedAddress) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

// --- Google Maps script loader (singleton) ---
let googleMapsPromise: Promise<void> | null = null;
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

function gComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  short = false
): string {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return "";
  return short ? match.short_name : match.long_name;
}

export function AddressAutocomplete({
  onSelect,
  defaultValue = "",
  placeholder = "Start typing a property address…",
  className,
}: AddressAutocompleteProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [value, setValue] = React.useState(defaultValue);
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SelectedAddress[]>([]);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const useGoogle = Boolean(apiKey);
  const skipNextFetch = React.useRef(false);

  // --- Google Places path ---
  React.useEffect(() => {
    if (!useGoogle) return;
    let autocomplete: google.maps.places.Autocomplete | null = null;
    setLoading(true);
    loadGoogleMaps(apiKey!)
      .then(() => {
        if (!inputRef.current) return;
        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: ["place_id", "formatted_address", "geometry", "address_components"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete!.getPlace();
          if (!place.address_components) return;
          const comps = place.address_components;
          const selected: SelectedAddress = {
            formattedAddress: place.formatted_address ?? "",
            placeId: place.place_id ?? "",
            latitude: place.geometry?.location?.lat() ?? null,
            longitude: place.geometry?.location?.lng() ?? null,
            street: [gComponent(comps, "street_number"), gComponent(comps, "route")]
              .filter(Boolean)
              .join(" "),
            city:
              gComponent(comps, "locality") ||
              gComponent(comps, "sublocality") ||
              gComponent(comps, "administrative_area_level_3"),
            state: gComponent(comps, "administrative_area_level_1", true),
            zip: gComponent(comps, "postal_code"),
            county: gComponent(comps, "administrative_area_level_2"),
          };
          setValue(selected.formattedAddress);
          onSelect(selected);
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    return () => {
      if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useGoogle, apiKey]);

  // --- Keyless server-suggest path (debounced) ---
  React.useEffect(() => {
    if (useGoogle) return;
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 5) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/address/suggest?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setActiveIndex(-1);
        setOpen((data.suggestions ?? []).length > 0);
      } catch {
        /* aborted or failed — ignore */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [value, useGoogle]);

  // Close the dropdown on outside click.
  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(s: SelectedAddress) {
    skipNextFetch.current = true;
    setValue(s.formattedAddress);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    onSelect(s);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (useGoogle) return;
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter" && value.trim()) {
        // No suggestions yet — accept the typed text as a raw address.
        e.preventDefault();
        pick({
          formattedAddress: value.trim(),
          placeId: "",
          latitude: null,
          longitude: null,
          city: "",
          state: "",
          zip: "",
          county: "",
        });
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(suggestions[activeIndex >= 0 ? activeIndex : 0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {!useGoogle && open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-background shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.formattedAddress}-${i}`}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => pick(s)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                  activeIndex === i ? "bg-accent" : "hover:bg-accent/50"
                )}
              >
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{s.formattedAddress}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
