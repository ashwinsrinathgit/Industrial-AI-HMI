import { type ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import { ProtectedRoute } from "@/components/dashboard/ProtectedRoute";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen w-full grid-bg">
          <AppSidebar />
          <SidebarInset className="bg-transparent">
            <TopNav />
            <main className="scrollbar-thin flex-1 space-y-6 p-4 md:p-6">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
