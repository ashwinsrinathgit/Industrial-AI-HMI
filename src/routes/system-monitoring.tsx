import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, ArrowRight, BarChart3, Gauge, LogIn, RadioTower } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AlertAnalysisSettings } from "@/components/dashboard/AlertAnalysisSettings";
import { TemperatureChart, VibrationChart } from "@/components/dashboard/Charts";
import { MachineStatusGrid } from "@/components/dashboard/MachineStatusGrid";
import { TopAlertsTable } from "@/components/dashboard/TopAlertsTable";
import { useBackendTelemetry } from "@/hooks/use-backend-telemetry";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/system-monitoring")({
  component: SystemMonitoringPage,
  head: () => ({
    meta: [
      { title: "System Monitoring Variables - Adaptive HMI" },
      {
        name: "description",
        content: "Shared temperature and vibration control for every Adaptive HMI role dashboard.",
      },
    ],
  }),
});

function SystemMonitoringPage() {
  const { snapshot, readingHistory, recentAlerts, connected, error, analyze, updateAlert } = useBackendTelemetry();
  const reading = snapshot?.data;
  const assessment = snapshot?.ai_assessment;
  const riskTone =
    assessment?.priority === "HIGH"
      ? "critical"
      : assessment?.priority === "MEDIUM"
        ? "warning"
        : "normal";

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground grid-bg">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-6 lg:px-8">
        <header className="animate-fade-in-up flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/70 p-5 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary glow-primary">
              <RadioTower className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Shared System Monitoring
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                System Monitoring Variables
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Temperature and vibration entered here become the same live machine state for Producer, Worker,
                Supervisor, Operator, Manager, and Maintenance views.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge connected={connected} error={error} />
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-4">
          <SignalMetric
            icon={Gauge}
            label="Machine"
            value={reading?.machine_id ?? "Waiting"}
            detail={reading ? `Timestamp ${new Date(reading.timestamp).toLocaleTimeString()}` : "Backend stream pending"}
            tone="normal"
          />
          <SignalMetric
            icon={Activity}
            label="Temperature"
            value={reading ? `${reading.temperature.toFixed(1)} C` : "-"}
            detail="Shared process value"
            tone={reading && reading.temperature > 85 ? "critical" : reading && reading.temperature > 75 ? "warning" : "normal"}
          />
          <SignalMetric
            icon={BarChart3}
            label="Vibration"
            value={reading ? `${reading.vibration.toFixed(2)} mm/s` : "-"}
            detail="Shared condition value"
            tone={reading && reading.vibration > 3 ? "critical" : reading && reading.vibration > 2.2 ? "warning" : "normal"}
          />
          <SignalMetric
            icon={ArrowRight}
            label="Risk"
            value={assessment?.priority ?? "LOW"}
            detail={reading ? `Status ${reading.status}, score ${assessment?.priority_score ?? 0}` : "No reading yet"}
            tone={riskTone}
          />
        </section>

        <section className="space-y-3">
          <AlertAnalysisSettings onAnalyze={analyze} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="glass animate-fade-in-up rounded-2xl p-5" style={{ animationDelay: "80ms" }}>
            <h2 className="mb-3 text-sm font-semibold">Shared Machine State</h2>
            <MachineStatusGrid reading={reading} />
          </div>
          <div className="glass animate-fade-in-up rounded-2xl p-5" style={{ animationDelay: "120ms" }}>
            <h2 className="mb-3 text-sm font-semibold">Active Alert Sync</h2>
            <TopAlertsTable alerts={recentAlerts} onUpdateAlert={updateAlert} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="glass animate-fade-in-up rounded-2xl p-5" style={{ animationDelay: "160ms" }}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Temperature Graph</h2>
              <span className="rounded-md border border-border/50 bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                Live shared values
              </span>
            </div>
            <TemperatureChart reading={reading} readings={readingHistory} />
          </div>
          <div className="glass animate-fade-in-up rounded-2xl p-5" style={{ animationDelay: "200ms" }}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Vibration Graph</h2>
              <span className="rounded-md border border-border/50 bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                Live shared values
              </span>
            </div>
            <VibrationChart reading={reading} readings={readingHistory} />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ connected, error }: { connected: boolean; error: string | null }) {
  return (
    <span
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold uppercase tracking-[0.14em]",
        connected
          ? "border-success/40 bg-success/10 text-success"
          : "border-warning/40 bg-warning/10 text-warning",
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", connected ? "bg-success animate-blink-dot" : "bg-warning")} />
      {connected ? "Live Sync" : error ?? "Connecting"}
    </span>
  );
}

function SignalMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: "normal" | "warning" | "critical";
}) {
  return (
    <div
      className={cn(
        "glass animate-fade-in-up rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5",
        tone === "critical" && "border-critical/40",
        tone === "warning" && "border-warning/40",
        tone === "normal" && "border-success/30",
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "critical" ? "text-critical" : tone === "warning" ? "text-warning" : "text-success",
          )}
        />
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}
