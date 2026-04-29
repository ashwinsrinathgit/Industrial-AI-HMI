import { AlertOctagon, BarChart3, Bell, Cpu, HeartPulse, ShieldCheck, Wrench } from "lucide-react";
import {
  AlertsOverTimeChart,
  SeverityDonut,
  TemperatureChart,
  VibrationChart,
} from "@/components/dashboard/Charts";
import { AiOperationsAgent } from "@/components/dashboard/AiOperationsAgent";
import { AiRecommendationsPanel } from "@/components/dashboard/AiRecommendationsPanel";
import { IndustryReadinessPanel } from "@/components/dashboard/IndustryReadinessPanel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MachineStatusGrid } from "@/components/dashboard/MachineStatusGrid";
import { MaintenanceInsights } from "@/components/dashboard/MaintenanceInsights";
import { RoleInformationPanel } from "@/components/dashboard/RoleInformationPanel";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { TopAlertsTable } from "@/components/dashboard/TopAlertsTable";
import { useBackendTelemetry } from "@/hooks/use-backend-telemetry";
import { useSession } from "@/hooks/use-session";

export function OverviewDashboard() {
  const {
    snapshot,
    readingHistory,
    manager,
    recentAlerts,
    roleData,
    recommendations,
    error,
    updateAlert,
  } = useBackendTelemetry();
  const { session } = useSession();

  const role = session?.user.role ?? "operator";
  const reading = snapshot?.data;
  const assessment = snapshot?.ai_assessment;
  const alerts = snapshot?.alerts;
  const latestAlertTimestamp = alerts?.all_alerts.find((alert) => alert.severity !== "info")?.timestamp;
  const summary = manager?.summary;
  const healthScore = assessment ? `${Math.max(0, 100 - assessment.priority_score).toFixed(1)}%` : "-";
  const activeMachineStatus =
    !reading ? "-" : reading.status === "critical" ? "1 critical" : reading.status === "warning" ? "1 warning" : "1 online";

  return (
    <>
      {!snapshot && (
        <div className="rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
          {error ? `Backend connection issue: ${error}` : "Loading role-scoped HMI data..."}
        </div>
      )}

      {role === "manager" && (
        <>
          <KpiGrid
            totalAlerts={`${summary?.total_alerts ?? recentAlerts.length}`}
            critical={`${summary?.critical_count ?? 0}`}
            health={healthScore}
            machines={activeMachineStatus}
          />
          <RoleBlock roleData={roleData} recentAlerts={recentAlerts} selectedRole={role} />
          <AiRecommendationsPanel reading={reading} assessment={assessment} alerts={recentAlerts} recommendations={recommendations} compact />
          <ManagerAnalytics alerts={alerts} recentAlerts={recentAlerts} updateAlert={updateAlert} />
        </>
      )}

      {role === "operator" && (
        <>
          <RoleBlock roleData={roleData} recentAlerts={recentAlerts} selectedRole={role} />
          <SectionHeader eyebrow="Operator View" title="Machine, Temperature & Vibration" icon={Cpu} accent="primary" />
          <MachineSignalGrid
            reading={reading}
            readings={readingHistory}
            assessment={assessment}
            alertTimestamp={latestAlertTimestamp}
          />
          <AiRecommendationsPanel reading={reading} assessment={assessment} alerts={recentAlerts} recommendations={recommendations} compact />
          <AiOperationsAgent assessment={assessment} reading={reading} alerts={recentAlerts} compact />
          <div className="glass rounded-2xl p-5">
            <h3 className="mb-3 text-sm font-semibold">Machine Floor</h3>
            <MachineStatusGrid reading={reading} />
          </div>
        </>
      )}

      {role === "producer" && (
        <>
          <RoleBlock roleData={roleData} recentAlerts={recentAlerts} selectedRole={role} />
          <AiRecommendationsPanel reading={reading} assessment={assessment} alerts={recentAlerts} recommendations={recommendations} compact />
          <SectionHeader eyebrow="Producer View" title="Output & Line Efficiency" icon={BarChart3} accent="success" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="glass rounded-2xl p-5 lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold">Alert Load Against Production</h3>
              <AlertsOverTimeChart alerts={alerts} />
            </div>
            <div className="glass rounded-2xl p-5">
              <h3 className="mb-3 text-sm font-semibold">Operational Distribution</h3>
              <SeverityDonut alerts={alerts} />
            </div>
          </div>
        </>
      )}

      {role === "worker" && (
        <>
          <RoleBlock roleData={roleData} recentAlerts={recentAlerts} selectedRole={role} />
          <SectionHeader eyebrow="Worker View" title="Safe Operation & Next Action" icon={ShieldCheck} accent="success" />
          <AiRecommendationsPanel reading={reading} assessment={assessment} alerts={recentAlerts} recommendations={recommendations} compact />
          <div className="glass rounded-2xl p-5">
            <h3 className="mb-3 text-sm font-semibold">Nearby Machine State</h3>
            <MachineStatusGrid reading={reading} />
          </div>
        </>
      )}

      {role === "supervisor" && (
        <>
          <RoleBlock roleData={roleData} recentAlerts={recentAlerts} selectedRole={role} />
          <AiRecommendationsPanel reading={reading} assessment={assessment} alerts={recentAlerts} recommendations={recommendations} compact />
          <IndustryReadinessPanel alerts={alerts} manager={manager} />
          <div className="glass rounded-2xl p-5">
            <h3 className="mb-3 text-sm font-semibold">Open Alert Queue</h3>
            <TopAlertsTable alerts={recentAlerts} onUpdateAlert={updateAlert} />
          </div>
        </>
      )}

      {role === "maintenance" && (
        <>
          <RoleBlock roleData={roleData} recentAlerts={recentAlerts} selectedRole={role} />
          <SectionHeader eyebrow="Maintenance View" title="Diagnostics & Operations Review" icon={Wrench} accent="warning" />
          <AiRecommendationsPanel reading={reading} assessment={assessment} alerts={recentAlerts} recommendations={recommendations} />
          <AiOperationsAgent assessment={assessment} reading={reading} alerts={recentAlerts} />
          <MachineSignalGrid
            reading={reading}
            readings={readingHistory}
            assessment={assessment}
            alertTimestamp={latestAlertTimestamp}
          />
          <MaintenanceInsights assessment={assessment} reading={reading} alerts={recentAlerts} />
        </>
      )}
    </>
  );
}

function RoleBlock({
  roleData,
  recentAlerts,
  selectedRole,
}: {
  roleData: Parameters<typeof RoleInformationPanel>[0]["roleData"];
  recentAlerts: Parameters<typeof RoleInformationPanel>[0]["recentAlerts"];
  selectedRole: Parameters<typeof RoleInformationPanel>[0]["selectedRole"];
}) {
  return <RoleInformationPanel roleData={roleData} recentAlerts={recentAlerts} selectedRole={selectedRole} />;
}

function KpiGrid({
  totalAlerts,
  critical,
  health,
  machines,
}: {
  totalAlerts: string;
  critical: string;
  health: string;
  machines: string;
}) {
  return (
    <section className="animate-fade-in-up">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Alerts" value={totalAlerts} delta={8} icon={Bell} tone="primary" />
        <KpiCard label="Critical Alerts" value={critical} delta={-15} icon={AlertOctagon} tone="critical" />
        <KpiCard label="System Health" value={health} delta={2} icon={HeartPulse} tone="success" />
        <KpiCard label="Active Machines" value={machines} delta={5} icon={Cpu} tone="warning" />
      </div>
    </section>
  );
}

function ManagerAnalytics({
  alerts,
  recentAlerts,
  updateAlert,
}: {
  alerts: Parameters<typeof AlertsOverTimeChart>[0]["alerts"];
  recentAlerts: Parameters<typeof TopAlertsTable>[0]["alerts"];
  updateAlert: NonNullable<Parameters<typeof TopAlertsTable>[0]["onUpdateAlert"]>;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader eyebrow="Manager View" title="Alert Totals & Severity" icon={BarChart3} accent="success" />
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
        <h3 className="mb-3 text-sm font-semibold">Top Active Alerts</h3>
        <TopAlertsTable alerts={recentAlerts} onUpdateAlert={updateAlert} />
      </div>
    </section>
  );
}

function MachineSignalGrid({
  reading,
  readings,
  assessment,
  alertTimestamp,
}: {
  reading: Parameters<typeof TemperatureChart>[0]["reading"];
  readings: Parameters<typeof TemperatureChart>[0]["readings"];
  assessment: { high_temperature?: boolean; abnormal_vibration?: boolean } | undefined;
  alertTimestamp?: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass rounded-2xl p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Temperature (C)</h3>
          <span className="rounded-md border border-critical/40 bg-critical/10 px-2 py-0.5 text-[10px] font-bold text-critical">
            {assessment?.high_temperature ? "ABOVE THRESHOLD" : "NORMAL"}
          </span>
        </div>
        <TemperatureChart reading={reading} readings={readings} alertTimestamp={alertTimestamp} />
      </div>
      <div className="glass rounded-2xl p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Vibration (mm/s)</h3>
          <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
            {assessment?.abnormal_vibration ? "ELEVATED" : "STABLE"}
          </span>
        </div>
        <VibrationChart reading={reading} readings={readings} alertTimestamp={alertTimestamp} />
      </div>
    </div>
  );
}
