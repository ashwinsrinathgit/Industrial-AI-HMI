import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Gauge,
  Play,
  ShieldAlert,
  Thermometer,
  Waves,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AnalyzeInput, AnalyzeResponse } from "@/lib/backend";

const scenarios = [
  {
    label: "Normal Run",
    machine_id: "Machine_A",
    temperature: 64,
    vibration: 1.2,
    detail: "Healthy baseline for green status.",
  },
  {
    label: "Heat Warning",
    machine_id: "Machine_B",
    temperature: 79,
    vibration: 2.4,
    detail: "Gradual temperature rise with moderate vibration.",
  },
  {
    label: "Critical Fault",
    machine_id: "Machine_C",
    temperature: 92,
    vibration: 4.1,
    detail: "Overheating plus abnormal vibration.",
  },
];

const CONTROL_STORAGE_KEY = "adaptive-hmi-alert-analysis-control";

function getSavedControlValues(): AnalyzeInput {
  if (typeof window === "undefined") {
    return {
      machine_id: "Machine_A",
      temperature: 91,
      vibration: 3.6,
    };
  }

  try {
    const saved = window.localStorage.getItem(CONTROL_STORAGE_KEY);
    if (!saved) {
      return {
        machine_id: "Machine_A",
        temperature: 46,
        vibration: 0.78,
      };
    }

    const parsed = JSON.parse(saved) as Partial<AnalyzeInput>;
      return {
        machine_id: parsed.machine_id?.trim() || "Machine_A",
        temperature: Number.isFinite(parsed.temperature) ? Number(parsed.temperature) : 46,
        vibration: Number.isFinite(parsed.vibration) ? Number(parsed.vibration) : 0.78,
      };
    } catch {
      return {
        machine_id: "Machine_A",
        temperature: 46,
        vibration: 0.78,
      };
  }
}

export function AlertAnalysisSettings({
  onAnalyze,
}: {
  onAnalyze: (input: AnalyzeInput) => Promise<AnalyzeResponse>;
}) {
  const savedControlValues = useMemo(() => getSavedControlValues(), []);
  const [machineId, setMachineId] = useState(savedControlValues.machine_id);
  const [temperature, setTemperature] = useState(savedControlValues.temperature);
  const [vibration, setVibration] = useState(savedControlValues.vibration);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");

  useEffect(() => {
    window.localStorage.setItem(
      CONTROL_STORAGE_KEY,
      JSON.stringify({
        machine_id: machineId,
        temperature,
        vibration,
      }),
    );
  }, [machineId, temperature, vibration]);

  const decision = useMemo(() => {
    if (!result) {
      return {
        headline: "Ready for scenario analysis",
        action: "Choose a preset or adjust the sliders, then run AI analysis.",
        tone: "info",
        checklist: ["Set machine ID", "Adjust temperature", "Adjust vibration"],
      };
    }

    if (result.input.status === "critical") {
      return {
        headline: "Critical fault detected",
        action: "Pause the affected machine, notify the shift lead, and run controlled response.",
        tone: "critical",
        checklist: ["Pause machine", "Verify sensors", "Check alignment", "Record incident"],
      };
    }

    if (result.input.status === "warning") {
      return {
        headline: "Warning condition detected",
        action: "Continue with increased monitoring and schedule engineering review.",
        tone: "warning",
        checklist: ["Reduce inspection interval", "Watch signal trend", "Create review ticket"],
      };
    }

    return {
      headline: "Machine is operating normally",
      action: "Keep production running and continue normal monitoring.",
      tone: "normal",
      checklist: ["Continue operation", "Keep sensor watch active", "No escalation needed"],
    };
  }, [result]);

  const currentRisk = result?.ai_assessment.priority ?? "PENDING";
  const currentScore = result?.ai_assessment.priority_score ?? 0;
  const currentStatus = result?.input.status ?? "ready";
  const riskClass =
    currentRisk === "HIGH"
      ? "border-critical/50 bg-critical/10 text-critical"
      : currentRisk === "MEDIUM"
        ? "border-warning/50 bg-warning/10 text-warning"
        : currentRisk === "LOW"
          ? "border-success/50 bg-success/10 text-success"
          : "border-info/40 bg-info/10 text-info";

  const submitAnalysis = async (override?: AnalyzeInput) => {
    const payload = override ?? {
      machine_id: machineId.trim() || "Machine_A",
      temperature,
      vibration,
    };

    setMachineId(payload.machine_id);
    setTemperature(payload.temperature);
    setVibration(payload.vibration);
    setStatus("running");

    try {
      const nextResult = await onAnalyze(payload);
      setResult(nextResult);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="glass animate-fade-in-up rounded-2xl p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Machine Settings
          </p>
          <h3 className="text-sm font-semibold">Temperature & Vibration Adjustment</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Set machine signal values and run backend analysis for the selected operating condition.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={cn("rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]", riskClass)}>
            {currentRisk === "PENDING" ? "Ready" : currentRisk}
          </span>
          <span className="rounded-lg border border-border/50 bg-background/40 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
            Score {currentScore}
          </span>
          <span className="rounded-lg border border-border/50 bg-background/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {currentStatus}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-info/40 bg-info/10 text-info">
            <Activity className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {scenarios.map((scenario, index) => (
          <button
            key={scenario.label}
            onClick={() => void submitAnalysis(scenario)}
            className="animate-fade-in-up rounded-xl border border-border/60 bg-secondary/30 p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">{scenario.label}</span>
              <Play className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{scenario.detail}</p>
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">
              {scenario.temperature}C / {scenario.vibration} mm/s
            </p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Gauge className="h-4 w-4 text-info" />
            Machine ID
          </span>
          <Input
            value={machineId}
            onChange={(event) => setMachineId(event.target.value)}
            className="border-border/50 bg-secondary/40 transition-colors focus-visible:border-primary/50 focus-visible:ring-primary/30"
          />
        </label>

        <label className="space-y-2">
          <span className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-critical" />
              Temperature
            </span>
            <span className="font-mono text-foreground">{temperature.toFixed(1)}C</span>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={temperature}
            onChange={(event) => setTemperature(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-red-500 transition-opacity hover:opacity-90"
          />
          <div className="h-1 overflow-hidden rounded-full bg-secondary/50">
            <div
              className="h-full rounded-full bg-critical transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, temperature))}%` }}
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-warning" />
              Vibration
            </span>
            <span className="font-mono text-foreground">{vibration.toFixed(2)} mm/s</span>
          </span>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.01"
            value={vibration}
            onChange={(event) => setVibration(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-yellow-400 transition-opacity hover:opacity-90"
          />
          <div className="h-1 overflow-hidden rounded-full bg-secondary/50">
            <div
              className="h-full rounded-full bg-warning transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, ((vibration - 0.1) / 9.9) * 100))}%` }}
            />
          </div>
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
        <button
          onClick={() => void submitAnalysis()}
          disabled={status === "running"}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/15 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/25 hover:shadow-[0_0_26px_rgba(34,197,94,0.15)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
        >
          <ShieldAlert className="h-4 w-4" />
          {status === "running" ? "Analyzing..." : "Run AI Analysis"}
        </button>

        <div
          className={cn(
            "rounded-xl border p-4 transition-all duration-300",
            decision.tone === "critical" && "border-critical/50 bg-critical/10",
            decision.tone === "warning" && "border-warning/50 bg-warning/10",
            decision.tone === "normal" && "border-success/50 bg-success/10",
            decision.tone === "info" && "border-info/40 bg-info/10",
          )}
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold">{decision.headline}</p>
              <p className="mt-1 text-xs text-muted-foreground">{decision.action}</p>
            </div>
            {result && (
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-md border border-border/60 bg-background/40 px-2 py-1">
                  Priority: {result.ai_assessment.priority}
                </span>
                <span className="rounded-md border border-border/60 bg-background/40 px-2 py-1">
                  Score: {result.ai_assessment.priority_score}
                </span>
                <span className="rounded-md border border-border/60 bg-background/40 px-2 py-1">
                  Status: {result.input.status}
                </span>
                <span className="rounded-md border border-border/60 bg-background/40 px-2 py-1">
                  Active alerts: {result.alerts.filtered_alerts.length}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {decision.checklist.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-background/40 px-2 py-1 text-[11px] text-muted-foreground"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                {item}
              </span>
            ))}
          </div>

          {status === "error" && (
            <p className="mt-3 text-xs text-critical">Backend analysis failed. Check that FastAPI is running.</p>
          )}
        </div>
      </div>
    </div>
  );
}
