import { BrainCircuit, CheckCircle2, ShieldAlert, Wrench } from "lucide-react";
import type { AiAssessment, BackendAlert, MachineReading, Recommendation } from "@/lib/backend";
import { cn } from "@/lib/utils";

const priorityClass: Record<string, string> = {
  LOW: "border-success/40 bg-success/10 text-success",
  MEDIUM: "border-warning/40 bg-warning/10 text-warning",
  HIGH: "border-critical/40 bg-critical/10 text-critical",
};

export function AiRecommendationsPanel({
  reading,
  assessment,
  alerts,
  recommendations,
  compact = false,
}: {
  reading?: MachineReading;
  assessment?: AiAssessment;
  alerts?: BackendAlert[];
  recommendations?: Recommendation[];
  compact?: boolean;
}) {
  const activeRootCause = alerts?.[0]?.root_cause ?? "Normal operating envelope";
  const items = recommendations?.length
    ? recommendations
    : [
        {
          id: "fallback-normal",
          machine_id: reading?.machine_id ?? "Machine_A",
          priority: "LOW" as const,
          action: "Continue normal monitoring and keep the current process envelope.",
          rationale: "Signals are stable and below active alert thresholds.",
          owner: "Operator",
        },
      ];

  return (
    <section className="glass animate-fade-in-up rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <BrainCircuit className="h-3.5 w-3.5" />
            AI Recommendations
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {activeRootCause}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={cn("rounded-md border px-2 py-1 text-[10px] font-bold uppercase", priorityClass[assessment?.priority ?? "LOW"])}>
            {assessment?.priority ?? "LOW"} Risk
          </span>
          {assessment?.predicted_critical && (
            <span className="rounded-md border border-critical/50 bg-critical/10 px-2 py-1 text-[10px] font-bold uppercase text-critical">
              Predicted Failure
            </span>
          )}
          <span className="rounded-md border border-border/60 bg-secondary/40 px-2 py-1 text-[10px] uppercase text-muted-foreground">
            Trend {assessment?.trend ?? "stable"}
          </span>
        </div>
      </div>

      <div className={cn("grid gap-3", compact ? "md:grid-cols-2" : "lg:grid-cols-3")}>
        {items.slice(0, compact ? 2 : 6).map((item, index) => (
          <div
            key={item.id}
            className="mac-surface animate-mac-pop rounded-xl border border-border/50 bg-background/25 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase", priorityClass[item.priority] ?? priorityClass.LOW)}>
                {item.priority}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {item.owner === "Maintenance" ? <Wrench className="h-3 w-3" /> : item.owner === "Operator" ? <ShieldAlert className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {item.owner}
              </span>
            </div>
            <p className="text-sm font-medium leading-5 text-foreground">{item.action}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.rationale}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
