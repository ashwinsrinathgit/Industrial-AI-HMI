import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OverviewDashboard } from "@/components/dashboard/OverviewDashboard";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Adaptive HMI - Intelligent Alert Management" },
      {
        name: "description",
        content:
          "AI-powered Adaptive Human Machine Interface dashboard for industrial alert management, operations monitoring, and governance.",
      },
    ],
  }),
});

function Index() {
  return (
    <DashboardShell>
      <OverviewDashboard />
    </DashboardShell>
  );
}
