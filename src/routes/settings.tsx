import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IndustryReadinessPanel } from "@/components/dashboard/IndustryReadinessPanel";
import { RoleInformationPanel } from "@/components/dashboard/RoleInformationPanel";
import { SelfConfiguringHmiPanel } from "@/components/dashboard/SelfConfiguringHmiPanel";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { useBackendTelemetry } from "@/hooks/use-backend-telemetry";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const {
    roleData,
    recentAlerts,
    snapshot,
    manager,
    hmiConfig,
    runtimeConfig,
    recommendation,
    updateConfig,
    recommendThresholds,
    error,
  } = useBackendTelemetry();

  return (
    <DashboardShell>
      <SectionHeader eyebrow="Operations" title="Settings" icon={Settings} accent="warning">
        {error && <span className="text-xs text-critical">{error}</span>}
      </SectionHeader>

      <SelfConfiguringHmiPanel
        hmiConfig={hmiConfig}
        runtimeConfig={runtimeConfig}
        recommendation={recommendation}
        onRecommend={recommendThresholds}
        onUpdateConfig={updateConfig}
      />
      <RoleInformationPanel roleData={roleData} recentAlerts={recentAlerts} />
      <IndustryReadinessPanel alerts={snapshot?.alerts} manager={manager} />

      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold">Backend Connection</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <InfoRow label="REST API" value="http://127.0.0.1:8000" />
          <InfoRow label="WebSocket" value="ws://127.0.0.1:8000/ws/live" />
          <InfoRow label="Analyze Endpoint" value="POST /analyze" />
          <InfoRow label="Role Endpoint" value="GET /dashboard?role=..." />
        </div>
      </div>
    </DashboardShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 break-all font-mono text-xs text-foreground">{value}</p>
    </div>
  );
}
