import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";
import { Bot, LockKeyhole, RadioTower, UserRound } from "lucide-react";
import { login, type DashboardRole } from "@/lib/backend";
import { saveSession } from "@/lib/auth";
import { Input } from "@/components/ui/input";

const roles: Array<{ role: DashboardRole; label: string; detail: string }> = [
  { role: "producer", label: "Producer", detail: "Output, efficiency, production blockers" },
  { role: "worker", label: "Worker", detail: "Safe operation state and next action" },
  { role: "supervisor", label: "Supervisor", detail: "Operators, open alerts, escalation" },
  { role: "operator", label: "Operator", detail: "Machine, temperature, vibration" },
  { role: "manager", label: "Manager", detail: "Total alerts, criticals, warnings" },
  { role: "maintenance", label: "Maintenance", detail: "Diagnostics and operations review" },
];

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("APEXVIHAG");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<DashboardRole>("operator");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await login({ user_id: userId, password, role });
      saveSession(session);
      await navigate({ to: "/" });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground grid-bg">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center gap-5">
      <Link
        to="/system-monitoring"
        className="glass animate-fade-in-up group flex w-full flex-col gap-4 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary glow-primary">
            <RadioTower className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Before Login
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">System Monitoring Variables</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Set shared temperature and vibration once. All six dashboards read the same values, alerts, graphs, and timestamp.
            </p>
          </div>
        </div>
        <span className="inline-flex h-10 items-center justify-center rounded-lg border border-primary/50 bg-primary/15 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary transition-all duration-300 group-hover:bg-primary/25">
          Open Variables
        </span>
      </Link>

      <form onSubmit={submit} className="animate-fade-in-up w-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl" style={{ animationDelay: "80ms" }}>
        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <section className="border-b border-border/60 bg-secondary/20 p-6 lg:border-b-0 lg:border-r">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Secure HMI Access</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Role-based operations login</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Sign in with a user ID, password, and operational role. The dashboard will only show the information needed for that role.
            </p>
          </section>

          <section className="space-y-5 p-6">
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserRound className="h-4 w-4 text-primary" />
                User ID
              </span>
              <Input value={userId} onChange={(event) => setUserId(event.target.value)} className="border-border/60 bg-secondary/30" />
            </label>

            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <LockKeyhole className="h-4 w-4 text-primary" />
                Access PIN
              </span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter access PIN"
                className="border-border/60 bg-secondary/30"
              />
            </label>

            <div>
              <p className="mb-2 text-xs text-muted-foreground">Select role</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setRole(item.role)}
                    className={`rounded-xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                      role === item.role
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-border/60 bg-secondary/25 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-[11px]">{item.detail}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="rounded-lg border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="h-11 w-full rounded-lg border border-primary/50 bg-primary/15 text-sm font-semibold uppercase tracking-[0.16em] text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/25 disabled:translate-y-0 disabled:opacity-60"
            >
              {busy ? "Signing in..." : "Login"}
            </button>
          </section>
        </div>
      </form>
      </div>
    </main>
  );
}
