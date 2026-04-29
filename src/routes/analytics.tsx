import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, BrainCircuit, ShieldAlert } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AlertsOverTimeChart, SeverityDonut } from "@/components/dashboard/Charts";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { useBackendTelemetry } from "@/hooks/use-backend-telemetry";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { snapshot, manager } = useBackendTelemetry();
  const alerts = snapshot?.alerts;
  const assessment = snapshot?.ai_assessment;
  const summary = manager?.summary;

  return (
    <DashboardShell>
      <SectionHeader eyebrow="Operations" title="Analytics" icon={BarChart3} accent="success" />

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Total Alerts" value={summary?.total_alerts ?? 0} detail="Processed by decision engine" />
        <Metric label="Critical Alerts" value={summary?.critical_count ?? 0} detail="Immediate escalation candidates" />
        <Metric label="AI Score" value={assessment?.priority_score ?? "-"} detail={assessment?.priority ?? "Waiting"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Alerts Over Time</h3>
          <AlertsOverTimeChart alerts={alerts} />
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 text-sm font-semibold">Severity Distribution</h3>
          <SeverityDonut alerts={alerts} />
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-2 text-warning">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Explanation</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {assessment?.explanation ?? "Waiting for live AI assessment from backend."}
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="h-4 w-4 text-info" />
        {label}
      </div>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
