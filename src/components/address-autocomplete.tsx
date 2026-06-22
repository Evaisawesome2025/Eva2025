"use client";

import * as React from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SelectedAddress } from "@/lib/types";

/**
 * Google-style address autocomplete backed by the Google Places JS library.
 *
 * Loads the Places library on demand using NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 * When no key is configured (e.g. local dev), it gracefully degrades to a plain
 * text input + a "use raw address" fallback so the rest of the app still works.
 *
 * On selection it emits a fully structured `SelectedAddress` including
 * place_id, lat/lng, city, state, zip, and county.
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

function component(
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
  placeholder = "Enter a property address…",
  className,
}: AddressAutocompleteProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState(defaultValue);
  const [loading, setLoading] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  React.useEffect(() => {
    if (!apiKey) return;
    let autocomplete: google.maps.places.Autocomplete | null = null;

    setLoading(true);
    loadGoogleMaps(apiKey)
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
            street: [
              component(comps, "street_number"),
              component(comps, "route"),
            ]
              .filter(Boolean)
              .join(" "),
            city:
              component(comps, "locality") ||
              component(comps, "sublocality") ||
              component(comps, "administrative_area_level_3"),
            state: component(comps, "administrative_area_level_1", true),
            zip: component(comps, "postal_code"),
            county: component(comps, "administrative_area_level_2"),
          };
          setValue(selected.formattedAddress);
          onSelect(selected);
        });
        setReady(true);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    return () => {
      if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Fallback: emit a minimal address from raw text when Places isn't available.
  function handleManualSubmit() {
    if (!value.trim()) return;
    onSelect({
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

  return (
    <div className={cn("relative", className)}>
      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !ready) {
            e.preventDefault();
            handleManualSubmit();
          }
        }}
        placeholder={placeholder}
        className="pl-9 pr-9"
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
      {!apiKey && (
        <p className="mt-1 text-xs text-muted-foreground">
          Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> for autocomplete.
          Press Enter to use the typed address.
        </p>
      )}
    </div>
  );
}
