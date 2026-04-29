import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  delta: number;
  icon: LucideIcon;
  tone?: "primary" | "critical" | "success" | "warning";
}

const toneMap: Record<string, string> = {
  primary: "text-info",
  critical: "text-critical",
  success: "text-success",
  warning: "text-warning",
};

const toneBg: Record<string, string> = {
  primary: "from-info/20 to-info/5",
  critical: "from-critical/25 to-critical/5",
  success: "from-success/20 to-success/5",
  warning: "from-warning/25 to-warning/5",
};

export function KpiCard({ label, value, delta, icon: Icon, tone = "primary" }: KpiCardProps) {
  const positive = delta >= 0;
  return (
    <div className="glass mac-surface animate-mac-pop group relative overflow-hidden rounded-2xl p-5">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", toneBg[tone])} />
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={cn("animate-gentle-float flex h-10 w-10 items-center justify-center rounded-xl bg-background/40 backdrop-blur", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-1.5 text-xs">
        <span
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium",
            positive ? "bg-success/15 text-success" : "bg-critical/15 text-critical",
          )}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {positive ? "+" : ""}
          {delta}%
        </span>
        <span className="text-muted-foreground">vs last 24h</span>
      </div>
    </div>
  );
}
