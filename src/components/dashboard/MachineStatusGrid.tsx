import { cn } from "@/lib/utils";
import type { MachineReading } from "@/lib/backend";

interface Machine {
  id: string;
  name: string;
  status: "online" | "warning" | "critical" | "offline";
  temperature: number;
  vibration: number;
}

const statusMap = {
  online: { dot: "bg-success", ring: "border-success/40", label: "Running" },
  warning: { dot: "bg-warning", ring: "border-warning/40", label: "Watch" },
  critical: { dot: "bg-critical animate-blink-dot", ring: "border-critical/50", label: "Alert" },
  offline: { dot: "bg-muted-foreground", ring: "border-border", label: "Offline" },
};

function machineFromReading(reading?: MachineReading): Machine[] {
  if (!reading) return [];
  const status = reading.status === "normal" ? "online" : reading.status;
  return [
    {
      id: reading.machine_id.replace("Machine_", ""),
      name: `${reading.machine_id.replace("_", " ")} Motor`,
      status,
      temperature: reading.temperature,
      vibration: reading.vibration,
    },
  ];
}

export function MachineStatusGrid({ reading }: { reading?: MachineReading }) {
  const machines = machineFromReading(reading);

  if (!machines.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-sm text-muted-foreground">
        Waiting for machine telemetry from the backend source.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {machines.map((machine) => {
        const status = statusMap[machine.status];
        const tempWidth = Math.min(100, Math.max(0, machine.temperature));
        const vibrationWidth = Math.min(100, Math.max(0, (machine.vibration / 10) * 100));

        return (
          <div
            key={machine.id}
            className={cn(
              "glass relative overflow-hidden rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40",
              status.ring,
            )}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{machine.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">MTR-{machine.id}</p>
              </div>
              <span className={cn("h-2 w-2 shrink-0 rounded-full", status.dot)} />
            </div>

            <div className="mt-3 space-y-2">
              <SignalBar
                label="Temperature"
                value={`${machine.temperature.toFixed(1)} C`}
                width={tempWidth}
                tone={machine.temperature > 85 ? "critical" : machine.temperature > 72 ? "warning" : "normal"}
              />
              <SignalBar
                label="Vibration"
                value={`${machine.vibration.toFixed(2)} mm/s`}
                width={vibrationWidth}
                tone={machine.vibration > 3 ? "critical" : machine.vibration > 2.2 ? "warning" : "normal"}
              />

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{status.label}</span>
                <span className="font-mono text-muted-foreground">Motor line</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SignalBar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: number;
  tone: "normal" | "warning" | "critical";
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            tone === "critical" ? "bg-critical" : tone === "warning" ? "bg-warning" : "bg-success",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
