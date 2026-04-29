import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, ArrowRight, BarChart3, Clock3, Gauge, LogIn, RadioTower, ShieldCheck, Sparkles } from "lucide-react";
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
  const latestAlertTimestamp = snapshot?.alerts.all_alerts.find((alert) => alert.severity !== "info")?.timestamp;
  const healthScore = assessment ? Math.max(0, 100 - assessment.priority_score) : 100;
  const latestTime = reading ? new Date(reading.timestamp).toLocaleTimeString() : "Waiting";
  const suggestedAction =
    reading?.status === "critical"
      ? "Controlled response required"
      : reading?.status === "warning"
        ? "Increase monitoring interval"
        : "Continue normal operation";
  const riskTone =
    assessment?.priority === "HIGH"
      ? "critical"
      : assessment?.priority === "MEDIUM"
        ? "warning"
        : "normal";

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground grid-bg">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-6 lg:px-8">
        <header className="mac-surface animate-mac-pop flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/70 p-5 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
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
              className="mac-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground hover:border-primary/50 hover:text-primary"
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

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass mac-surface animate-mac-pop rounded-2xl p-5" style={{ animationDelay: "60ms" }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Operational Forecast</p>
                <h2 className="text-sm font-semibold">Live Health Snapshot</h2>
              </div>
              <Sparkles className="h-5 w-5 text-primary animate-gentle-float" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <InsightTile label="Health" value={`${healthScore}%`} detail="Derived from AI score" tone={riskTone} />
              <InsightTile label="Latest Sync" value={latestTime} detail="Shared timestamp" tone="normal" />
              <InsightTile label="Next Action" value={suggestedAction} detail="Role views use this state" tone={riskTone} />
            </div>
          </div>

          <div className="glass mac-surface animate-mac-pop rounded-2xl p-5" style={{ animationDelay: "100ms" }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Six-Role Sync</p>
                <h2 className="text-sm font-semibold">Shared Dashboard Propagation</h2>
              </div>
              <ShieldCheck className="h-5 w-5 text-success animate-gentle-float" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {["Producer", "Worker", "Supervisor", "Operator", "Manager", "Maintenance"].map((role, index) => (
                <div
                  key={role}
                  className="mac-surface rounded-xl border border-border/50 bg-background/40 p-3"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{role}</span>
                    <span className="h-2 w-2 rounded-full bg-success animate-blink-dot" />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {reading ? `${reading.temperature.toFixed(1)} C / ${reading.vibration.toFixed(2)} mm/s` : "Waiting for signal"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <AlertAnalysisSettings onAnalyze={analyze} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="glass mac-surface animate-mac-pop rounded-2xl p-5" style={{ animationDelay: "80ms" }}>
            <h2 className="mb-3 text-sm font-semibold">Shared Machine State</h2>
            <MachineStatusGrid reading={reading} />
          </div>
          <div className="glass mac-surface animate-mac-pop rounded-2xl p-5" style={{ animationDelay: "120ms" }}>
            <h2 className="mb-3 text-sm font-semibold">Active Alert Sync</h2>
            <TopAlertsTable alerts={recentAlerts} onUpdateAlert={updateAlert} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="glass mac-surface animate-mac-pop rounded-2xl p-5" style={{ animationDelay: "160ms" }}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Temperature Graph</h2>
              <span className="rounded-md border border-border/50 bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                <Clock3 className="mr-1 inline h-3 w-3" />
                Live shared values
              </span>
            </div>
            <TemperatureChart reading={reading} readings={readingHistory} alertTimestamp={latestAlertTimestamp} />
          </div>
          <div className="glass mac-surface animate-mac-pop rounded-2xl p-5" style={{ animationDelay: "200ms" }}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Vibration Graph</h2>
              <span className="rounded-md border border-border/50 bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                <Clock3 className="mr-1 inline h-3 w-3" />
                Live shared values
              </span>
            </div>
            <VibrationChart reading={reading} readings={readingHistory} alertTimestamp={latestAlertTimestamp} />
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
        "glass mac-surface animate-mac-pop rounded-2xl p-4",
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

function InsightTile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "normal" | "warning" | "critical";
}) {
  return (
    <div
      className={cn(
        "mac-surface rounded-xl border bg-background/40 p-3",
        tone === "critical" && "border-critical/40",
        tone === "warning" && "border-warning/40",
        tone === "normal" && "border-success/30",
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 line-clamp-2 text-sm font-semibold">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}
