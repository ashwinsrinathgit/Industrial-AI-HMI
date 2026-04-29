import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type Severity = "critical" | "warning" | "normal";

export interface AlertItem {
  id: string;
  machine: string;
  type: string;
  description: string;
  severity: Severity;
  time: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  reasons?: string[];
}

const config: Record<Severity, { color: string; ring: string; bg: string; Icon: typeof AlertTriangle }> = {
  critical: {
    color: "text-critical",
    ring: "border-critical/40",
    bg: "from-critical/20 via-critical/5 to-transparent",
    Icon: AlertTriangle,
  },
  warning: {
    color: "text-warning",
    ring: "border-warning/40",
    bg: "from-warning/15 via-warning/5 to-transparent",
    Icon: AlertCircle,
  },
  normal: {
    color: "text-success",
    ring: "border-success/40",
    bg: "from-success/15 via-success/5 to-transparent",
    Icon: Info,
  },
};

export function AlertCard({ alert, index = 0 }: { alert: AlertItem; index?: number }) {
  const c = config[alert.severity];
  const isCritical = alert.severity === "critical";
  const priorityLabel = alert.severity === "critical" ? "CRITICAL" : alert.priority ?? "LOW";

  return (
    <div
      className={cn(
        "glass mac-surface animate-mac-pop relative overflow-hidden rounded-xl border p-4",
        c.ring,
        alert.priority === "HIGH" && "shadow-[0_0_0_1px_rgba(248,113,113,0.35)]",
        isCritical && "animate-pulse-critical",
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-70", c.bg)} />
      <div className="relative flex items-start gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/50 backdrop-blur", c.color)}>
          <c.Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold">{alert.machine}</span>
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                c.color,
                c.ring,
              )}
            >
              {priorityLabel}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{alert.type}</p>
          <p className="mt-2 text-xs text-foreground/80 line-clamp-2">{alert.description}</p>
          {alert.reasons?.length ? (
            <div className="mt-2 rounded-md border border-border/40 bg-background/40 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Why this alert triggered
              </p>
              <p className="mt-1 text-[11px] text-foreground/75 line-clamp-2">{alert.reasons.join("; ")}</p>
            </div>
          ) : null}
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={cn("h-1.5 w-1.5 rounded-full", isCritical ? "bg-critical animate-blink-dot" : "bg-muted-foreground/60")} />
            {alert.time}
          </div>
        </div>
      </div>
    </div>
  );
}
