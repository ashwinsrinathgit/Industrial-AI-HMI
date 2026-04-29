import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
