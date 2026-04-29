import { AlertCard, type AlertItem } from "./AlertCard";
import type { BackendAlert } from "@/lib/backend";

function relativeTime(timestamp: string) {
  const ageSeconds = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (ageSeconds < 5) return "just now";
  if (ageSeconds < 60) return `${ageSeconds}s ago`;
  if (ageSeconds < 3600) return `${Math.round(ageSeconds / 60)}m ago`;
  return `${Math.round(ageSeconds / 3600)}h ago`;
}

function toAlertItem(alert: BackendAlert): AlertItem {
  return {
    id: alert.id,
    machine: alert.machine_id,
    type: alert.title,
    description: alert.message,
    severity: alert.severity === "info" ? "normal" : alert.severity,
    time: relativeTime(alert.timestamp),
    priority: alert.priority,
    reasons: alert.reasons,
  };
}

export function LiveAlertFeed({
  alerts = [],
  hideLowPriority = false,
  focusCriticalOnly = false,
}: {
  alerts?: BackendAlert[];
  hideLowPriority?: boolean;
  focusCriticalOnly?: boolean;
}) {
  const items = alerts
    .filter((alert) => {
      if (focusCriticalOnly && alert.severity !== "critical") return false;
      if (hideLowPriority && alert.priority === "LOW") return false;
      return true;
    })
    .slice(0, 4)
    .map(toAlertItem);

  if (!items.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-sm text-muted-foreground">
        No active alerts. New rows appear only when backend telemetry or manual analysis creates a real alert.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((alert, index) => (
        <AlertCard key={alert.id} alert={alert} index={index} />
      ))}
    </div>
  );
}
