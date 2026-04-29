import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Thermometer, Waves } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MachineStatusGrid } from "@/components/dashboard/MachineStatusGrid";
import { TemperatureChart, VibrationChart } from "@/components/dashboard/Charts";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { useBackendTelemetry } from "@/hooks/use-backend-telemetry";

export const Route = createFileRoute("/machines")({
  component: MachinesPage,
});

function MachinesPage() {
  const { snapshot } = useBackendTelemetry();
  const reading = snapshot?.data;
  const assessment = snapshot?.ai_assessment;

  return (
    <DashboardShell>
      <SectionHeader eyebrow="Operations" title="Machines" icon={Cpu} accent="primary" />

      <div className="grid gap-4 md:grid-cols-3">
        <MachineMetric label="Machine" value={reading?.machine_id ?? "Machine_A"} detail={reading?.status ?? "waiting"} />
        <MachineMetric label="Pattern" value={reading?.pattern?.replace("_", " ") ?? "-"} detail="Simulation mode" />
        <MachineMetric label="Priority" value={assessment?.priority ?? "-"} detail={`Score ${assessment?.priority_score ?? "-"}`} />
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="mb-3 text-sm font-semibold">Machine Floor</h3>
        <MachineStatusGrid reading={reading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Thermometer className="h-4 w-4 text-critical" />
            Temperature Trend
          </div>
          <TemperatureChart reading={reading} />
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Waves className="h-4 w-4 text-warning" />
            Vibration Trend
          </div>
          <VibrationChart reading={reading} />
        </div>
      </div>
    </DashboardShell>
  );
}

function MachineMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold capitalize">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground capitalize">{detail}</p>
    </div>
  );
}
