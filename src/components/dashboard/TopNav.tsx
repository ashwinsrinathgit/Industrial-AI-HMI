import { Bell, ChevronDown, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { roleLabel } from "@/lib/auth";
import { useBackendTelemetry } from "@/hooks/use-backend-telemetry";
import { useSession } from "@/hooks/use-session";

export function TopNav() {
  const { session, logout } = useSession();
  const { recentAlerts } = useBackendTelemetry();
  const initials = session?.user.display_name ? session.user.display_name.slice(0, 2).toUpperCase() : "AV";
  const activeCriticalAlerts = recentAlerts.filter(
    (alert) => alert.severity === "critical" && !alert.resolved,
  ).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="hidden flex-col leading-tight md:flex">
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Plant Control - Sector 7
        </span>
        <span className="text-sm font-medium">Adaptive HMI Dashboard</span>
      </div>

      <div className="relative ml-auto hidden w-full max-w-sm md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search machines, alerts, operators..."
          className="border-border/50 bg-secondary/40 pl-9 text-sm focus-visible:ring-primary/40"
        />
      </div>

      <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-secondary/40 text-muted-foreground transition-colors hover:text-foreground">
        <Bell className="h-4 w-4" />
        {activeCriticalAlerts > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-critical animate-blink-dot" />
        )}
      </button>

      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/40 px-2 py-1.5">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xs text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden flex-col leading-tight sm:flex">
          <span className="text-xs font-medium">{session?.user.display_name ?? "APEXVIHAG"}</span>
          <span className="text-[10px] text-muted-foreground">
            {session ? roleLabel(session.user.role) : "Plant Admin"}
          </span>
        </div>
        <button type="button" onClick={logout} className="hidden text-[10px] text-muted-foreground hover:text-foreground sm:block">
          Logout
        </button>
        <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
      </div>
    </header>
  );
}
