import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function SectionHeader({
  eyebrow,
  title,
  icon: Icon,
  accent = "primary",
  children,
}: {
  eyebrow: string;
  title: string;
  icon: LucideIcon;
  accent?: "primary" | "warning" | "success";
  children?: React.ReactNode;
}) {
  const accentMap = {
    primary: "text-info bg-info/10 border-info/30",
    warning: "text-warning bg-warning/10 border-warning/30",
    success: "text-success bg-success/10 border-success/30",
  };
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", accentMap[accent])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</p>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
      </div>
      {children}
    </div>
  );
}
