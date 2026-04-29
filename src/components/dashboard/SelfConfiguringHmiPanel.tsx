import { useState } from "react";
import { BrainCircuit, LayoutGrid, SlidersHorizontal, WandSparkles } from "lucide-react";
import type { ConfigResponse, HmiConfig, RuntimeConfig, ThresholdRecommendation } from "@/lib/backend";

export function SelfConfiguringHmiPanel({
  hmiConfig,
  runtimeConfig,
  recommendation,
  onRecommend,
  onUpdateConfig,
}: {
  hmiConfig: HmiConfig | null;
  runtimeConfig: ConfigResponse | null;
  recommendation: ThresholdRecommendation | null;
  onRecommend: () => Promise<ThresholdRecommendation>;
  onUpdateConfig: (config: Partial<RuntimeConfig>) => Promise<RuntimeConfig>;
}) {
  const config = runtimeConfig?.config;
  const [temperature, setTemperature] = useState(config?.temperature_threshold ?? 85);
  const [vibration, setVibration] = useState(config?.vibration_threshold ?? 3);
  const [busy, setBusy] = useState(false);

  const applyConfig = async (override?: Partial<RuntimeConfig>) => {
    setBusy(true);
    try {
      const updated = await onUpdateConfig({
        temperature_threshold: temperature,
        vibration_threshold: vibration,
        ...override,
      });
      setTemperature(updated.temperature_threshold);
      setVibration(updated.vibration_threshold);
    } finally {
      setBusy(false);
    }
  };

  const runRecommendation = async () => {
    setBusy(true);
    try {
      await onRecommend();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Self-Configuring HMI
          </p>
          <h3 className="text-sm font-semibold">Generated Layout + AI Threshold Configuration</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Widgets and thresholds are driven by backend templates and runtime configuration.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runRecommendation}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-info/50 bg-info/10 px-3 py-2 text-xs font-semibold text-info disabled:opacity-50"
          >
            <WandSparkles className="h-4 w-4" />
            Recommend
          </button>
          <button
            onClick={() => void applyConfig()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/15 px-3 py-2 text-xs font-semibold text-primary disabled:opacity-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Apply
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <LayoutGrid className="h-4 w-4 text-primary" />
            Auto-Generated Widgets
          </div>
          <div className={hmiConfig?.layout === "stack" ? "space-y-2" : "grid gap-2 sm:grid-cols-2"}>
            {(hmiConfig?.widgets ?? []).map((widget) => (
              <div key={widget.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
                <p className="text-xs font-semibold">{widget.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {widget.type} · {widget.source}
                </p>
              </div>
            ))}
            {!hmiConfig?.widgets?.length && (
              <p className="text-xs text-muted-foreground">Waiting for generated HMI configuration.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BrainCircuit className="h-4 w-4 text-warning" />
            Low-Code Thresholds
          </div>
          <label className="block space-y-2">
            <span className="flex justify-between text-xs text-muted-foreground">
              Temperature threshold <b className="text-foreground">{temperature.toFixed(1)}C</b>
            </span>
            <input
              type="range"
              min="60"
              max="100"
              step="0.5"
              value={temperature}
              onChange={(event) => setTemperature(Number(event.target.value))}
              className="w-full accent-red-500"
            />
          </label>
          <label className="mt-4 block space-y-2">
            <span className="flex justify-between text-xs text-muted-foreground">
              Vibration threshold <b className="text-foreground">{vibration.toFixed(2)} mm/s</b>
            </span>
            <input
              type="range"
              min="1"
              max="5"
              step="0.05"
              value={vibration}
              onChange={(event) => setVibration(Number(event.target.value))}
              className="w-full accent-yellow-400"
            />
          </label>

          {recommendation && (
            <div className="mt-4 rounded-lg border border-info/40 bg-info/10 p-3">
              <p className="text-xs font-semibold">AI Recommendation</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Temp {recommendation.recommended_temp_threshold}C · Vibration{" "}
                {recommendation.recommended_vibration_threshold} mm/s · Confidence{" "}
                {Math.round(recommendation.confidence * 100)}%
              </p>
              <button
                onClick={() => {
                  setTemperature(recommendation.recommended_temp_threshold);
                  setVibration(recommendation.recommended_vibration_threshold);
                  void applyConfig({
                    temperature_threshold: recommendation.recommended_temp_threshold,
                    vibration_threshold: recommendation.recommended_vibration_threshold,
                  });
                }}
                className="mt-2 rounded-md border border-info/50 px-2 py-1 text-[11px] text-info"
              >
                Apply Recommendation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
