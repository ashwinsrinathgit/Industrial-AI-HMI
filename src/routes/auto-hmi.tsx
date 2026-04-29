import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, CheckSquare2, LayoutTemplate, LineChart, Loader2, PanelsTopLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { generateAdaptiveHmi, type HmiConfig } from "@/lib/backend";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auto-hmi")({
  component: AutoHmiPage,
});

const signalOptions = ["temperature", "vibration", "pressure", "load", "speed"];

function AutoHmiPage() {
  const [machineType, setMachineType] = useState("CNC");
  const [signals, setSignals] = useState(["temperature", "vibration"]);
  const [layout, setLayout] = useState<HmiConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSignal = (signal: string) => {
    setSignals((current) =>
      current.includes(signal)
        ? current.filter((item) => item !== signal)
        : [...current, signal],
    );
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      setLayout(await generateAdaptiveHmi({ machine_type: machineType, signals }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "HMI generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <SectionHeader eyebrow="Adaptive Builder" title="Auto HMI Generator" icon={LayoutTemplate} accent="primary">
        <button
          onClick={() => void generate()}
          disabled={loading}
          className="mac-button inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-primary disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
          Generate
        </button>
      </SectionHeader>

      <section className="glass animate-fade-in-up rounded-2xl p-5">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Machine Type
            </label>
            <select
              value={machineType}
              onChange={(event) => setMachineType(event.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-3 text-sm outline-none transition focus:border-primary/50"
            >
              {["CNC", "Motor", "Pump", "Compressor", "Conveyor"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Signals</div>
              {signalOptions.map((signal) => (
                <button
                  key={signal}
                  onClick={() => toggleSignal(signal)}
                  className={cn(
                    "mac-button flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition",
                    signals.includes(signal)
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border/60 bg-secondary/30 text-muted-foreground",
                  )}
                >
                  <span>{signal.replace("_", " ").toUpperCase()}</span>
                  {signals.includes(signal) && <CheckSquare2 className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[360px] rounded-2xl border border-border/50 bg-background/20 p-4">
            {error && <div className="rounded-xl border border-critical/40 bg-critical/10 p-4 text-sm text-critical">{error}</div>}
            {!layout && !error && (
              <div className="flex h-full min-h-[320px] items-center justify-center text-center text-sm text-muted-foreground">
                Select signals and generate a role-ready HMI layout.
              </div>
            )}
            {layout && <GeneratedLayout layout={layout} />}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

function GeneratedLayout({ layout }: { layout: HmiConfig }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{layout.machine_type}</p>
          <h3 className="text-lg font-semibold">Generated Adaptive Dashboard</h3>
        </div>
        <span className="rounded-md border border-success/40 bg-success/10 px-2 py-1 text-[10px] font-bold uppercase text-success">
          {layout.widgets.length} widgets
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {layout.widgets.map((widget, index) => (
          <div
            key={widget.id}
            className="mac-surface animate-mac-pop rounded-xl border border-border/50 bg-secondary/25 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">{widget.title}</span>
              {widget.type === "trend_chart" ? <LineChart className="h-4 w-4 text-primary" /> : <PanelsTopLeft className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="h-20 rounded-lg border border-border/40 bg-background/40 p-3 text-xs text-muted-foreground">
              <div className="h-full rounded-md bg-gradient-to-r from-primary/10 via-warning/10 to-critical/10" />
            </div>
            <div className="mt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {widget.type} / {widget.source}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
