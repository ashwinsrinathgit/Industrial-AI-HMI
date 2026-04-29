import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, AlertTriangle, BarChart3, Cpu, Settings, Activity } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/hooks/use-session";
import type { DashboardRole } from "@/lib/backend";

const allRoles: DashboardRole[] = ["producer", "worker", "supervisor", "operator", "manager", "maintenance"];

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: allRoles },
  { title: "Alerts", url: "/alerts", icon: AlertTriangle, roles: allRoles },
  { title: "Analytics", url: "/analytics", icon: BarChart3, roles: allRoles },
  { title: "Machines", url: "/machines", icon: Cpu, roles: allRoles },
  { title: "Settings", url: "/settings", icon: Settings, roles: allRoles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { session } = useSession();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => currentPath === p;
  const visibleItems = session
    ? items.filter((item) => item.roles.includes(session.user.role as DashboardRole))
    : items.slice(0, 1);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent glow-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-wide gradient-text">ADAPT-HMI</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Intelligent Alerts
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:shadow-[inset_2px_0_0_var(--primary)]"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="glass rounded-lg p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-blink-dot" />
              <span className="text-muted-foreground">System Online</span>
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground/70">v2.4.1 · Edge Sync</div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
