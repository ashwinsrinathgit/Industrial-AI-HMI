import { cn } from "@/lib/utils";
import type { BackendAlert } from "@/lib/backend";
import type { Severity } from "./AlertCard";

interface Row {
  alertId?: string;
  id: string;
  alert: string;
  rootCause: string;
  predicted: boolean;
  time: string;
  severity: Severity;
  priority: BackendAlert["priority"];
  status: "Active" | "Acknowledged" | "Resolved";
}

const sevColor: Record<Severity, string> = {
  critical: "text-critical bg-critical/15 border-critical/40",
  warning: "text-warning bg-warning/15 border-warning/40",
  normal: "text-success bg-success/15 border-success/40",
};

const statusColor: Record<Row["status"], string> = {
  Active: "text-critical",
  Acknowledged: "text-warning",
  Resolved: "text-success",
};

const priorityColor: Record<BackendAlert["priority"], string> = {
  LOW: "text-success bg-success/15 border-success/40",
  MEDIUM: "text-warning bg-warning/15 border-warning/40",
  HIGH: "text-critical bg-critical/15 border-critical/40",
};

function relativeTime(timestamp: string) {
  const ageSeconds = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (ageSeconds < 5) return "just now";
  if (ageSeconds < 60) return `${ageSeconds}s ago`;
  if (ageSeconds < 3600) return `${Math.round(ageSeconds / 60)}m ago`;
  return `${Math.round(ageSeconds / 3600)}h ago`;
}

function toRow(alert: BackendAlert): Row {
  return {
    alertId: alert.id,
    id: alert.machine_id,
    alert: alert.message,
    rootCause: alert.root_cause,
    predicted: alert.prediction_score >= 0.7 || alert.correlation_key === "predicted_critical",
    time: relativeTime(alert.timestamp),
    severity: alert.severity === "info" ? "normal" : alert.severity,
    priority: alert.priority,
    status: alert.resolved ? "Resolved" : alert.acknowledged ? "Acknowledged" : "Active",
  };
}

export function TopAlertsTable({
  alerts = [],
  onUpdateAlert,
}: {
  alerts?: BackendAlert[];
  onUpdateAlert?: (alertId: string, action: "acknowledge" | "resolve") => Promise<void>;
}) {
  const tableRows = alerts.filter((alert) => !alert.resolved).slice(0, 8).map(toRow);

  return (
    <div className="mac-surface overflow-hidden rounded-xl border border-border/50 bg-background/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Machine ID</th>
              <th className="px-4 py-3 text-left font-medium">Alert</th>
              <th className="px-4 py-3 text-left font-medium">Root Cause</th>
              <th className="px-4 py-3 text-left font-medium">Time</th>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!tableRows.length && (
              <tr className="border-t border-border/40">
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No active alerts. Safe signals are normal, and old incidents stay in history instead of blocking this queue.
                </td>
              </tr>
            )}
            {tableRows.map((r, i) => (
              <tr
                key={r.alertId ?? `${r.id}-${r.time}`}
                className="group animate-mac-pop border-t border-border/40 transition-[background-color,transform] duration-300 hover:bg-primary/5"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <td className="px-4 py-3 font-mono text-xs text-info">{r.id}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span>{r.alert}</span>
                    {r.predicted && (
                      <span className="w-fit rounded-md border border-critical/40 bg-critical/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-critical">
                        Predicted Failure
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.rootCause}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.time}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", priorityColor[r.priority] ?? sevColor[r.severity])}>
                    {r.severity === "critical" ? "CRITICAL" : r.priority}
                  </span>
                </td>
                <td className={cn("px-4 py-3 text-xs font-medium", statusColor[r.status])}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", r.status === "Active" ? "bg-critical animate-blink-dot" : r.status === "Acknowledged" ? "bg-warning" : "bg-success")} />
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => r.alertId && void onUpdateAlert?.(r.alertId, "acknowledge")}
                      disabled={!r.alertId || r.status !== "Active"}
                      className="mac-button rounded-md border border-border/60 bg-secondary/40 px-2 py-1 text-[10px] font-medium hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
                    >
                      ACK
                    </button>
                    <button
                      onClick={() => r.alertId && void onUpdateAlert?.(r.alertId, "resolve")}
                      disabled={!r.alertId || r.status === "Resolved"}
                      className="mac-button rounded-md border border-border/60 bg-secondary/40 px-2 py-1 text-[10px] font-medium hover:border-success/50 hover:text-success disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
                    >
                      Resolve
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
