import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import type { AlertBundle, MachineReading } from "@/lib/backend";

const axisStyle = { fontSize: 10, fill: "oklch(0.68 0.025 252)" };
const gridStroke = "oklch(0.32 0.03 262 / 0.4)";

function tooltipStyle() {
  return {
    contentStyle: {
      background: "oklch(0.18 0.03 262 / 0.95)",
      border: "1px solid oklch(0.32 0.03 262 / 0.6)",
      borderRadius: 12,
      backdropFilter: "blur(12px)",
      fontSize: 12,
      color: "oklch(0.96 0.01 240)",
      boxShadow: "0 8px 32px oklch(0 0 0 / 0.4)",
    },
    labelStyle: { color: "oklch(0.68 0.025 252)", fontSize: 10, textTransform: "uppercase" as const },
  };
}

function formatReadingTime(timestamp: string, index: number) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return `${String(index).padStart(2, "0")}m`;
  }
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function buildReadingSeries(
  readings: MachineReading[] | undefined,
  reading: MachineReading | undefined,
  field: "temperature" | "vibration",
) {
  const source = readings?.length ? readings : reading ? [reading] : [];
  const points = source.map((item, index) => ({
    t: formatReadingTime(item.timestamp, index),
    v: Number(item[field].toFixed(2)),
  }));

  if (points.length === 1) {
    return [{ ...points[0], t: "Previous" }, points[0]];
  }

  return points;
}

export function TemperatureChart({
  reading,
  readings,
}: {
  reading?: MachineReading;
  readings?: MachineReading[];
}) {
  const data = buildReadingSeries(readings, reading, "temperature");
  const t = tooltipStyle();
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.68 0.24 22)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="oklch(0.68 0.24 22)" stopOpacity={0} />
          </linearGradient>
          <filter id="tempGlow"><feGaussianBlur stdDeviation="2.5" /></filter>
        </defs>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="t" tick={axisStyle} axisLine={false} tickLine={false} interval={4} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={[40, 100]} />
        <Tooltip {...t} formatter={(v: number) => [`${v}°C`, "Temp"]} />
        <Area
          type="monotone"
          dataKey="v"
          stroke="oklch(0.78 0.18 30)"
          strokeWidth={2}
          fill="url(#tempGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "oklch(0.85 0.2 30)", stroke: "white", strokeWidth: 1 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VibrationChart({
  reading,
  readings,
}: {
  reading?: MachineReading;
  readings?: MachineReading[];
}) {
  const data = buildReadingSeries(readings, reading, "vibration");
  const t = tooltipStyle();
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="t" tick={axisStyle} axisLine={false} tickLine={false} interval={4} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={[0, 10]} />
        <Tooltip {...t} formatter={(v: number) => [`${v} mm/s`, "Vibration"]} />
        <Line
          type="monotone"
          dataKey="v"
          stroke="oklch(0.78 0.18 152)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "oklch(0.82 0.18 152)", stroke: "white", strokeWidth: 1 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AlertsOverTimeChart({ alerts }: { alerts?: AlertBundle }) {
  const recent = alerts?.active_alerts ?? alerts?.filtered_alerts ?? [];
  const data = recent.length
    ? Array.from({ length: 12 }, (_, i) => {
        const bucketAlerts = recent.filter((_, index) => index % 12 === i);
        return {
          h: `${i * 2}h`,
          c: bucketAlerts.filter((alert) => alert.severity === "critical").length,
          w: bucketAlerts.filter((alert) => alert.severity === "warning").length,
          n: Math.max(0, bucketAlerts.filter((alert) => alert.severity === "info").length),
        };
      })
    : Array.from({ length: 12 }, (_, i) => ({
    h: `${i * 2}h`,
    c: 0,
    w: 0,
    n: 0,
  }));
  const t = tooltipStyle();
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="h" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip {...t} cursor={{ fill: "oklch(0.78 0.18 152 / 0.06)" }} />
        <Bar dataKey="n" stackId="a" fill="oklch(0.78 0.18 152 / 0.85)" radius={[0, 0, 4, 4]} />
        <Bar dataKey="w" stackId="a" fill="oklch(0.83 0.17 88 / 0.85)" />
        <Bar dataKey="c" stackId="a" fill="oklch(0.68 0.24 22 / 0.95)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SeverityDonut({ alerts }: { alerts?: AlertBundle }) {
  const source = alerts?.active_alerts ?? alerts?.filtered_alerts ?? [];
  const critical = source.filter((alert) => alert.severity === "critical").length;
  const warning = source.filter((alert) => alert.severity === "warning").length;
  const normal = Math.max(1, source.length - critical - warning);
  const total = critical + warning + normal;
  const donutData = source.length
    ? [
        { name: "Critical", value: critical, color: "oklch(0.68 0.24 22)" },
        { name: "Warning", value: warning, color: "oklch(0.83 0.17 88)" },
        { name: "Normal", value: normal, color: "oklch(0.78 0.18 152)" },
      ]
    : [
        { name: "Critical", value: 0, color: "oklch(0.68 0.24 22)" },
        { name: "Warning", value: 0, color: "oklch(0.83 0.17 88)" },
        { name: "Normal", value: 0, color: "oklch(0.78 0.18 152)" },
      ];
  const t = tooltipStyle();
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
        <Tooltip {...t} formatter={(v: number, n) => [`${v}`, n as string]} />
          <Pie
            data={donutData}
            innerRadius={60}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {donutData.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total</span>
        <span className="text-2xl font-semibold">{source.length ? total : 0}</span>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-xs">
        {donutData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
