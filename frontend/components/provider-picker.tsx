"use client";

import { useEffect, useState } from "react";
import { getLLMProviders, type ProviderInfo } from "@/lib/api";

interface ProviderPickerProps {
  /** Selected provider name, or "" for auto (first configured). */
  provider: string;
  onProviderChange: (provider: string) => void;
  /** Model override, or "" for the provider's default. */
  model: string;
  onModelChange: (model: string) => void;
}

/**
 * Provider + model selector for LLM-powered modules.
 *
 * Shows the FULL catalogue of supported providers — configured ones are
 * selectable; unconfigured ones are visible but disabled, with the env
 * key that would enable them. A free-text model field overrides the
 * provider's default model.
 */
export function ProviderPicker({
  provider,
  onProviderChange,
  model,
  onModelChange,
}: ProviderPickerProps) {
  const [catalogue, setCatalogue] = useState<ProviderInfo[]>([]);

  useEffect(() => {
    getLLMProviders()
      .then((r) => setCatalogue(r.catalogue ?? []))
      .catch(() => {});
  }, []);

  const selected = catalogue.find((p) => p.name === provider);
  const defaultModel =
    selected?.default_model ??
    catalogue.find((p) => p.configured)?.default_model ??
    "provider default";

  return (
    <>
      <label className="text-sm">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          LLM provider
        </span>
        <select
          className="input-refined"
          value={provider}
          onChange={(e) => onProviderChange(e.target.value)}
        >
          <option value="">Auto (first configured)</option>
          {catalogue.map((p) => (
            <option key={p.name} value={p.name} disabled={!p.configured}>
              {p.label}
              {p.configured ? "" : ` — add ${p.env_key}`}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Model (optional)
        </span>
        <input
          type="text"
          placeholder={defaultModel ?? "provider default"}
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="input-refined"
        />
      </label>
    </>
  );
}
