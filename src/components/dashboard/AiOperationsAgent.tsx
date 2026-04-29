import { Bot, CheckCircle2, Gauge, Radar, ShieldCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AiAssessment, BackendAlert, MachineReading } from "@/lib/backend";
import { cn } from "@/lib/utils";

interface AiOperationsAgentProps {
  assessment?: AiAssessment;
  reading?: MachineReading;
  alerts?: BackendAlert[];
  compact?: boolean;
}

function scoreFor(value: number, limit: number) {
  if (!Number.isFinite(value) || !Number.isFinite(limit) || limit <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((value / limit) * 100));
}

function agentDecision(score: number) {
  if (score >= 88) return "Immediate controlled response";
  if (score >= 70) return "Escalate to shift lead";
  if (score >= 45) return "Watch with increased sampling";
  return "Standard monitoring";
}

function agentState(score: number) {
  if (score >= 88) return "Critical";
  if (score >= 70) return "High";
  if (score >= 45) return "Watch";
  return "Normal";
}

export function AiOperationsAgent({
  assessment,
  reading,
  alerts = [],
  compact = false,
}: AiOperationsAgentProps) {
  const score = assessment?.priority_score ?? 0;
  const confidence = Math.round((assessment?.confidence ?? 0) * 100);
  const tempLimit = assessment?.thresholds.temperature_threshold ?? 85;
  const vibrationLimit = assessment?.thresholds.vibration_threshold ?? 3;
  const tempScore = reading ? scoreFor(reading.temperature, tempLimit) : 0;
  const vibrationScore = reading ? scoreFor(reading.vibration, vibrationLimit) : 0;
  const activeCritical = alerts.filter((alert) => alert.severity === "critical" && !alert.resolved).length;
  const activeWarning = alerts.filter((alert) => alert.severity === "warning" && !alert.resolved).length;
  const normalShare = Math.max(0, 100 - Math.max(score, tempScore, vibrationScore));

  const decision = agentDecision(score);
  const state = agentState(score);
  const signalBars = [
    { name: "Temperature", value: tempScore, fill: "oklch(0.68 0.24 22)" },
    { name: "Vibration", value: vibrationScore, fill: "oklch(0.83 0.17 88)" },
    { name: "AI Score", value: score, fill: "oklch(0.78 0.18 152)" },
    { name: "Confidence", value: confidence, fill: "oklch(0.7 0.18 295)" },
  ];
  const modelMix = [
    { name: "Operational Margin", value: normalShare, color: "oklch(0.78 0.18 152)" },
    { name: "Temperature Load", value: Math.max(1, tempScore), color: "oklch(0.68 0.24 22)" },
    { name: "Vibration Load", value: Math.max(1, vibrationScore), color: "oklch(0.83 0.17 88)" },
  ];
  const checks = [
    "Temperature channel evaluated",
    "Vibration channel evaluated",
    "Priority score calculated",
    activeCritical ? "Critical queue active" : "No critical queue",
  ];

  return (
    <section className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-success/40 bg-success/10 text-success">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              AI Monitoring Agent
            </p>
            <h3 className="text-sm font-semibold">Operations Model Control</h3>
            <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
              Calculates current operating risk from temperature, vibration, configured limits, alert state, and model confidence.
            </p>
          </div>
        </div>

        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-right",
            state === "Critical" && "border-critical/40 bg-critical/10 text-critical",
            state === "High" && "border-warning/40 bg-warning/10 text-warning",
            state === "Watch" && "border-warning/40 bg-warning/10 text-warning",
            state === "Normal" && "border-success/40 bg-success/10 text-success",
          )}
        >
          <p className="text-[10px] uppercase tracking-[0.18em]">Agent State</p>
          <p className="text-sm font-semibold">{state}</p>
        </div>
      </div>

      <div className={cn("grid gap-4", compact ? "lg:grid-cols-3" : "xl:grid-cols-[0.8fr_1.1fr_1.1fr]")}>
        <div className="rounded-xl border border-border/50 bg-background/40 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            Decision
          </div>
          <p className="mt-3 text-2xl font-semibold">{score}</p>
          <p className="mt-1 text-xs text-muted-foreground">{decision}</p>
          <div className="mt-4 grid gap-2 text-[11px]">
            <AgentMetric label="Critical alerts" value={String(activeCritical)} />
            <AgentMetric label="Warning alerts" value={String(activeWarning)} />
            <AgentMetric label="Confidence" value={`${confidence || "--"}%`} />
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-background/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Gauge className="h-4 w-4 text-success" />
            Model Signal Load
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={signalBars} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.68 0.025 252)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "oklch(0.68 0.025 252)" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {signalBars.map((item) => (
                  <Cell key={item.name} fill={item.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border/50 bg-background/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Radar className="h-4 w-4 text-warning" />
            Operating Mix
          </div>
          <div className="grid gap-3 md:grid-cols-[150px_1fr]">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={modelMix} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={2}>
                  {modelMix.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center gap-2">
              {checks.map((check) => (
                <div key={check} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  {check}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/50 bg-secondary/30 px-2 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}
