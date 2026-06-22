"use client";

import * as React from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_SCORING_CONFIG,
  loadLocalConfig,
  saveLocalConfig,
  type ScoringConfig,
} from "@/lib/scoring-config";

const FIELDS: {
  key: keyof ScoringConfig;
  label: string;
  hint: string;
  step: number;
  transformIn?: (v: number) => number;
  transformOut?: (v: number) => number;
}[] = [
  {
    key: "arvMultiplier",
    label: "ARV Rule (%)",
    hint: "Max offer = ARV × this − repairs",
    step: 1,
    // Stored as a fraction (0.70) but edited as a percent (70).
    transformIn: (v) => Math.round(v * 100),
    transformOut: (v) => v / 100,
  },
  {
    key: "targetRoiPct",
    label: "Target Cash-on-Cash ROI (%)",
    hint: "ROI that maxes the score's ROI component",
    step: 1,
  },
  {
    key: "targetMarginPct",
    label: "Target Profit Margin (%)",
    hint: "Profit ÷ ARV that maxes the margin component",
    step: 1,
  },
  {
    key: "greenThreshold",
    label: "Green Threshold",
    hint: "Score at/above this is a strong deal",
    step: 1,
  },
  {
    key: "yellowThreshold",
    label: "Yellow Threshold",
    hint: "Score at/above this is proceed-with-caution",
    step: 1,
  },
];

export function ScoringSettingsForm({ authEnabled }: { authEnabled: boolean }) {
  const [config, setConfig] = React.useState<ScoringConfig>(
    DEFAULT_SCORING_CONFIG
  );
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Hydrate from localStorage (and the API when signed in).
  React.useEffect(() => {
    setConfig(loadLocalConfig());
    if (authEnabled) {
      fetch("/api/settings")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.scoringConfig) setConfig(data.scoringConfig);
        })
        .catch(() => {});
    }
  }, [authEnabled]);

  function update(key: keyof ScoringConfig, value: number) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    saveLocalConfig(config);
    if (authEnabled) {
      try {
        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scoringConfig: config }),
        });
      } catch {
        // localStorage still holds the value.
      }
    }
    setSaving(false);
    setSaved(true);
  }

  function reset() {
    setConfig(DEFAULT_SCORING_CONFIG);
    saveLocalConfig(DEFAULT_SCORING_CONFIG);
    setSaved(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => {
          const display = f.transformIn
            ? f.transformIn(config[f.key])
            : config[f.key];
          return (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`cfg-${f.key}`}>{f.label}</Label>
              <Input
                id={`cfg-${f.key}`}
                type="number"
                step={f.step}
                min={0}
                value={display}
                onChange={(e) => {
                  const raw = Number(e.target.value) || 0;
                  update(f.key, f.transformOut ? f.transformOut(raw) : raw);
                }}
              />
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : saved ? <Check /> : null}
          {saved ? "Saved" : "Save assumptions"}
        </Button>
        <Button onClick={reset} variant="outline">
          <RotateCcw />
          Reset to defaults
        </Button>
      </div>

      {!authEnabled && (
        <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          Saved to this browser. Connect Supabase + sign in to sync your
          assumptions across devices.
        </p>
      )}
    </div>
  );
}
