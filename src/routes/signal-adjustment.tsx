import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/signal-adjustment")({
  component: SignalAdjustmentPage,
});

function SignalAdjustmentPage() {
  return <Navigate to="/system-monitoring" replace />;
}
