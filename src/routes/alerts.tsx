import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BellRing } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LiveAlertFeed } from "@/components/dashboard/LiveAlertFeed";
import { TopAlertsTable } from "@/components/dashboard/TopAlertsTable";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { AiRecommendationsPanel } from "@/components/dashboard/AiRecommendationsPanel";
import { useBackendTelemetry } from "@/hooks/use-backend-telemetry";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const { snapshot, recentAlerts, recommendations, connected, error, updateAlert } = useBackendTelemetry();
  const critical = recentAlerts.filter((alert) => alert.severity === "critical");
  const warning = recentAlerts.filter((alert) => alert.severity !== "critical");

  return (
    <DashboardShell>
      <SectionHeader eyebrow="Operations" title="Alert Center" icon={BellRing} accent="primary">
        <span className="text-xs text-muted-foreground">
          {connected ? "Live backend stream" : error ?? "Connecting"}
        </span>
      </SectionHeader>

      <AiRecommendationsPanel
        reading={snapshot?.data}
        assessment={snapshot?.ai_assessment}
        alerts={recentAlerts}
        recommendations={recommendations}
      />

      <section className="animate-fade-in-up space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-critical" />
          <h3 className="text-sm font-semibold">Critical Alerts</h3>
          <span className="rounded-md border border-critical/40 bg-critical/10 px-2 py-0.5 text-[10px] text-critical">
            {critical.length}
          </span>
        </div>
        <LiveAlertFeed alerts={critical} />
      </section>

      <section className="animate-fade-in-up space-y-3" style={{ animationDelay: "60ms" }}>
        <h3 className="text-sm font-semibold">Warning Alerts</h3>
        <LiveAlertFeed alerts={warning} />
      </section>

      <section className="glass animate-fade-in-up rounded-2xl p-5" style={{ animationDelay: "120ms" }}>
        <h3 className="mb-3 text-sm font-semibold">All Active Alerts</h3>
        <TopAlertsTable alerts={recentAlerts} onUpdateAlert={updateAlert} />
      </section>
    </DashboardShell>
  );
}
