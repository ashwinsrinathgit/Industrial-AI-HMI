import { ClipboardList, Download, FileCheck2, LockKeyhole, RadioTower, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AlertBundle, BackendAlert, ManagerDashboard } from "@/lib/backend";

export function IndustryReadinessPanel({
  alerts,
  manager,
}: {
  alerts?: AlertBundle;
  manager?: ManagerDashboard | null;
}) {
  const activeAlerts = alerts?.active_alerts ?? alerts?.filtered_alerts ?? [];
  const alertHistory = alerts?.all_alerts ?? [];
  const critical = activeAlerts.filter((alert) => alert.severity === "critical" && !alert.resolved).length;
  const acknowledged = alertHistory.filter((alert) => alert.acknowledged).length;
  const resolved = alertHistory.filter((alert) => alert.resolved).length;
  const audit = alerts?.audit_log ?? [];
  const slaStatus = critical > 0 ? "Escalation active" : "Within SLA";
  const leadingAlert = activeAlerts.find((alert) => alert.severity === "critical" && !alert.resolved) ?? activeAlerts[0];

  const exportIncidentReport = () => {
    const report = {
      generated_by: "APEXVIHAG",
      generated_at: new Date().toISOString(),
      sla_status: slaStatus,
      summary: manager?.summary,
      active_alerts: activeAlerts.slice(0, 20),
      alert_history: alertHistory.slice(0, 20),
      audit_log: audit.slice(0, 20),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "adaptive-hmi-incident-report.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Industry Readiness
          </p>
          <h3 className="text-sm font-semibold">Operations Governance Center</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Tracks SLA state, operator actions, compliance posture, and incident evidence.
          </p>
        </div>
        <button
          onClick={exportIncidentReport}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition-colors hover:bg-primary/25"
        >
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <ReadinessMetric icon={RadioTower} label="SLA State" value={slaStatus} detail={`${critical} critical open`} />
        <ReadinessMetric icon={FileCheck2} label="Acknowledged" value={acknowledged} detail="Operator-confirmed alerts" />
        <ReadinessMetric icon={FileCheck2} label="Resolved" value={resolved} detail="Closed incident items" />
        <ReadinessMetric icon={LockKeyhole} label="Compliance" value="Audit Ready" detail={`${audit.length} action events`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            Safety Compliance
          </div>
          <p className="mt-2 text-sm font-semibold">
            {critical > 0 ? "Controlled response required" : "Safe operating state"}
          </p>
          <div className="mt-3 space-y-2">
            {(leadingAlert?.safety_actions ?? ["continue normal monitoring"]).map((action) => (
              <p key={action} className="rounded-md border border-border/50 bg-background/40 px-2 py-1 text-[11px] text-muted-foreground">
                {action}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ClipboardList className="h-4 w-4 text-warning" />
            Shift Handover
          </div>
          <p className="mt-2 text-sm font-semibold">
            {critical > 0 ? `${critical} critical item(s) for next shift` : "No critical handover item"}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Pending: {activeAlerts.filter((alert) => !alert.resolved).length} alerts, acknowledged: {acknowledged}, resolved: {resolved}.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileCheck2 className="h-4 w-4 text-info" />
            Maintenance Ticket
          </div>
          <p className="mt-2 text-sm font-semibold">
            {leadingAlert?.maintenance_ticket?.ticket_id ?? "No ticket required"}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {leadingAlert?.maintenance_ticket
              ? `${leadingAlert.maintenance_ticket.priority} - ${leadingAlert.maintenance_ticket.assigned_team}`
              : "System will generate a ticket when risk rises."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
          <h4 className="text-sm font-semibold">Escalation Queue</h4>
          <div className="mt-3 space-y-2">
            {activeAlerts.filter((alert) => alert.severity === "critical" && !alert.resolved).slice(0, 4).map((alert) => (
              <QueueItem key={alert.id} alert={alert} />
            ))}
            {!activeAlerts.some((alert) => alert.severity === "critical" && !alert.resolved) && (
              <p className="text-xs text-muted-foreground">No critical escalation pending.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
          <h4 className="text-sm font-semibold">Audit Trail</h4>
          <div className="mt-3 space-y-2">
            {audit.slice(0, 4).map((event) => (
              <div key={event.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
                <p className="text-xs font-medium">{event.note}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(event.timestamp).toLocaleTimeString()} · {event.action.toUpperCase()}
                </p>
              </div>
            ))}
            {!audit.length && <p className="text-xs text-muted-foreground">No operator actions recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadinessMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4 text-info" />
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function QueueItem({ alert }: { alert: BackendAlert }) {
  return (
    <div className="rounded-lg border border-critical/30 bg-critical/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold">{alert.machine_id}</p>
        <span className="rounded-md border border-critical/40 px-2 py-0.5 text-[10px] text-critical">
          {alert.priority}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{alert.message}</p>
    </div>
  );
}
