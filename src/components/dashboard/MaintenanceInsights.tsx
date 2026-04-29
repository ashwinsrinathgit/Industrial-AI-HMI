import { Brain, Clock3, GitCompareArrows, IndianRupee, TicketCheck, TrendingUp, Zap } from "lucide-react";
import type { AiAssessment, BackendAlert, MachineReading } from "@/lib/backend";

export function MaintenanceInsights({
  assessment,
  reading,
  alerts = [],
}: {
  assessment?: AiAssessment;
  reading?: MachineReading;
  alerts?: BackendAlert[];
}) {
  const activeInsight = alerts[0]?.diagnostic_hint ?? assessment?.explanation;
  const activeAlert = alerts[0];
  const rootCauses = activeAlert?.root_causes ?? [];
  const confidence = Math.round((assessment?.confidence ?? 0.87) * 100);
  const correlation = reading
    ? Math.min(0.98, Math.max(0.42, (reading.temperature / 100 + reading.vibration / 5) / 2))
    : 0.91;
  const correlationPercent = Math.round(correlation * 100);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="glass relative overflow-hidden rounded-2xl p-5 lg:col-span-2">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
            <Brain className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AI Operations Insight</p>
            <h3 className="mt-1 text-base font-semibold">
              Priority score for <span className="font-mono text-info">{reading?.machine_id ?? "Machine_A"}</span> is{" "}
              <span className="text-warning">{assessment?.priority_score ?? 87}</span>
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeInsight ??
                "Signals are being monitored for temperature and vibration patterns that indicate early degradation."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-warning">
                Confidence {confidence}%
              </span>
              <span className="rounded-md border border-border/60 bg-secondary/40 px-2 py-1 text-muted-foreground">
                Risk: {assessment?.risk_level ?? "high"}
              </span>
              <span className="rounded-md border border-border/60 bg-secondary/40 px-2 py-1 text-muted-foreground">
                Pattern: {reading?.pattern?.replace("_", " ") ?? "live baseline"}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InsightMetric
                icon={Clock3}
                label="Response Window"
                value={
                  activeAlert?.estimated_failure_minutes
                    ? `${activeAlert.estimated_failure_minutes} min`
                    : "Standard monitoring"
                }
              />
              <InsightMetric
                icon={IndianRupee}
                label="Downtime Cost"
                value={
                  activeAlert?.downtime_cost_per_hour
                    ? `Rs ${activeAlert.downtime_cost_per_hour.toLocaleString()}/hr`
                    : "Rs 0/hr"
                }
              />
              <InsightMetric
                icon={TicketCheck}
                label="Ticket"
                value={activeAlert?.maintenance_ticket?.ticket_id ?? "No ticket needed"}
              />
            </div>
            <div className="mt-4 rounded-xl border border-border/50 bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Root Cause Analysis</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(rootCauses.length ? rootCauses : ["normal operating condition"]).map((cause) => (
                  <span
                    key={cause}
                    className="rounded-md border border-border/60 bg-secondary/40 px-2 py-1 text-[11px] text-muted-foreground"
                  >
                    {cause}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GitCompareArrows className="h-4 w-4 text-info" />
            Temp to Vibration Correlation
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold gradient-text">{correlation.toFixed(2)}</span>
            <span className="text-[10px] uppercase tracking-wider text-warning">
              {correlation > 0.74 ? "Strong" : correlation > 0.55 ? "Moderate" : "Watch"}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-info via-warning to-critical"
              style={{ width: `${correlationPercent}%` }}
            />
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-success" />
            Temperature
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold">
              {reading?.temperature.toFixed(1) ?? "62.0"}
              <span className="text-sm text-muted-foreground">C</span>
            </span>
            <span className="text-[10px] font-medium text-success">{assessment?.high_temperature ? "High" : "Nominal"}</span>
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-4 w-4 text-warning" />
            Vibration
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold">
              {reading?.vibration.toFixed(2) ?? "1.20"}
              <span className="text-sm text-muted-foreground"> mm/s</span>
            </span>
            <span className="text-[10px] font-medium text-success">
              {assessment?.abnormal_vibration ? "Abnormal" : "Stable"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-info" />
        {label}
      </div>
      <p className="mt-2 text-xs font-semibold">{value}</p>
    </div>
  );
}
