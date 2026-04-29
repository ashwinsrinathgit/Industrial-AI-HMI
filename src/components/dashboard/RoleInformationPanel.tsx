import { useMemo, useState } from "react";
import { BriefcaseBusiness, ClipboardCheck, ShieldCheck, UserCog, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BackendAlert, DashboardRole, RoleDashboard } from "@/lib/backend";

const roles: Array<{
  role: DashboardRole;
  label: string;
  description: string;
  Icon: typeof BriefcaseBusiness;
}> = [
  {
    role: "producer",
    label: "Producer",
    description: "Output, efficiency, and production blockers",
    Icon: BriefcaseBusiness,
  },
  {
    role: "worker",
    label: "Worker",
    description: "Safe actions and machine instructions",
    Icon: ClipboardCheck,
  },
  {
    role: "supervisor",
    label: "Supervisor",
    description: "Team overview and escalation queue",
    Icon: ShieldCheck,
  },
  {
    role: "operator",
    label: "Operator",
    description: "Live machine state and active alerts",
    Icon: UserCog,
  },
  {
    role: "manager",
    label: "Manager",
    description: "Alert totals and mission alerts",
    Icon: Users,
  },
  {
    role: "maintenance",
    label: "Maintenance",
    description: "Diagnostics and repair hints",
    Icon: Wrench,
  },
];

export function RoleInformationPanel({
  roleData,
  recentAlerts,
  selectedRole,
}: {
  roleData: Partial<Record<DashboardRole, RoleDashboard>>;
  recentAlerts: BackendAlert[];
  selectedRole?: DashboardRole;
}) {
  const [localRole, setLocalRole] = useState<DashboardRole>("producer");
  const activeRole = selectedRole ?? localRole;
  const activeMeta = roles.find((item) => item.role === activeRole) ?? roles[0];
  const payload = roleData[activeRole];
  const cards = useMemo(() => toCards(activeRole, payload, recentAlerts), [activeRole, payload, recentAlerts]);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Role-Based HMI</p>
          <h3 className="text-sm font-semibold">
            {selectedRole ? `${activeMeta.label} operational view` : "Different information for different roles"}
          </h3>
        </div>
        {!selectedRole && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {roles.map(({ role, label, Icon }) => (
            <button
              key={role}
              onClick={() => setLocalRole(role)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                activeRole === role
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>}
      </div>

      <div className="mb-4 rounded-xl border border-border/50 bg-background/40 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-info/40 bg-info/10 text-info">
            <activeMeta.Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold">{activeMeta.label}</h4>
            <p className="text-sm text-muted-foreground">{activeMeta.description}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border/50 bg-secondary/30 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-lg font-semibold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function toCards(role: DashboardRole, payload: RoleDashboard | undefined, recentAlerts: BackendAlert[]) {
  if (!payload) {
    return [
      {
        label: "Loading",
        value: "Waiting for backend",
        detail: "Role data will appear when /dashboard responds.",
      },
    ];
  }

  const currentMachineId = currentMachineForRole(role, payload);
  const activeAlert = recentAlerts.find(
    (alert) =>
      !alert.resolved
      && alert.machine_id === currentMachineId
      && alert.severity === "critical",
  )
    ?? recentAlerts.find(
      (alert) =>
        !alert.resolved
        && alert.machine_id === currentMachineId
        && alert.severity === "warning",
    );
  const roleAlertCard = activeAlert ? [alertCardForRole(role, activeAlert)] : [];

  if (role === "producer") {
    const focus = payload.production_focus as Record<string, string> | undefined;
    return [
      ...roleAlertCard,
      { label: "Target Output", value: focus?.target_output ?? "-", detail: "Planned production for the shift." },
      { label: "Estimated Output", value: focus?.estimated_output ?? "-", detail: "Adjusted by current alert risk." },
      { label: "Line Efficiency", value: focus?.line_efficiency ?? "-", detail: `Quality risk: ${focus?.quality_risk ?? "-"}` },
    ];
  }

  if (role === "worker") {
    const instructions = (payload.work_instructions as string[] | undefined) ?? [];
    return [
      ...roleAlertCard,
      { label: "Safe To Operate", value: payload.safe_to_operate ? "Yes" : "No", detail: "Based on current machine state." },
      { label: "Nearest Machine", value: String(payload.nearest_machine ?? "-"), detail: "Primary machine for this worker view." },
      { label: "Next Step", value: instructions[0] ?? "No instruction", detail: instructions.slice(1).join(" ") || "Continue monitoring." },
    ];
  }

  if (role === "supervisor") {
    const overview = payload.team_overview as Record<string, unknown> | undefined;
    return [
      ...roleAlertCard,
      { label: "Active Operators", value: String(overview?.active_operators ?? "-"), detail: "Current shift staffing." },
      { label: "Open Alerts", value: String(overview?.open_alerts ?? recentAlerts.length), detail: "All open alert workload." },
      { label: "Escalation", value: overview?.escalation_required ? "Required" : "Not required", detail: "Based on mission alerts." },
    ];
  }

  if (role === "operator") {
    const machine = payload.machine_data as Record<string, unknown> | undefined;
    return [
      ...roleAlertCard,
      { label: "Machine", value: String(machine?.machine_id ?? "-"), detail: `Status: ${machine?.status ?? "-"}` },
      { label: "Temperature", value: `${machine?.temperature ?? "-"} C`, detail: "Live process signal." },
      { label: "Vibration", value: `${machine?.vibration ?? "-"} mm/s`, detail: "Live condition signal." },
    ];
  }

  if (role === "manager") {
    const summary = payload.summary as Record<string, unknown> | undefined;
    return [
      ...roleAlertCard,
      { label: "Total Alerts", value: String(summary?.total_alerts ?? "-"), detail: "Current alert volume." },
      { label: "Critical Alerts", value: String(summary?.critical_count ?? "-"), detail: "Needs executive attention." },
      { label: "Warnings", value: String(summary?.warning_count ?? "-"), detail: "Developing operational risk." },
    ];
  }

  const diagnostics = (payload.diagnostic_insights as Array<Record<string, unknown>> | undefined) ?? [];
  return [
    ...roleAlertCard,
    { label: "Diagnostics", value: String(diagnostics.length), detail: "Available maintenance insights." },
    { label: "Latest Severity", value: String(diagnostics[0]?.severity ?? "-"), detail: String(diagnostics[0]?.insight ?? "No active diagnosis.") },
    { label: "Machine", value: String(diagnostics[0]?.machine_id ?? "-"), detail: "Machine needing maintenance review." },
  ];
}

function currentMachineForRole(role: DashboardRole, payload: RoleDashboard) {
  if (role === "worker") {
    return String(payload.nearest_machine ?? "");
  }
  const machine = payload.machine_data as Record<string, unknown> | undefined;
  return String(machine?.machine_id ?? "");
}

function alertCardForRole(role: DashboardRole, alert: BackendAlert) {
  const signalText = `${alert.machine_id}: ${alert.severity} alert, score ${alert.priority_score}`;
  if (role === "producer") {
    return {
      label: "Production Alert",
      value: signalText,
      detail: "Review output risk and line impact from the shared system monitoring variables.",
    };
  }
  if (role === "worker") {
    return {
      label: "Worker Alert",
      value: signalText,
      detail: alert.safety_actions[0] ?? "Follow safe operation instruction for this machine.",
    };
  }
  if (role === "supervisor") {
    return {
      label: "Supervisor Alert",
      value: signalText,
      detail: "Coordinate operator, worker, and maintenance response.",
    };
  }
  if (role === "operator") {
    return {
      label: "Operator Alert",
      value: signalText,
      detail: alert.message,
    };
  }
  if (role === "manager") {
    return {
      label: "Manager Alert",
      value: signalText,
      detail: "Track critical count, downtime exposure, and escalation status.",
    };
  }
  return {
    label: "Maintenance Alert",
    value: signalText,
    detail: alert.diagnostic_hint,
  };
}
