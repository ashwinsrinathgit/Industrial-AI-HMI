import { useEffect, useState } from "react";
import { clearSession, getSession, type AppSession } from "@/lib/auth";

export function useSession() {
  const [session, setSession] = useState<AppSession | null>(() => getSession());

  useEffect(() => {
    const sync = () => setSession(getSession());
    window.addEventListener("storage", sync);
    window.addEventListener("adaptive-hmi-session-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("adaptive-hmi-session-change", sync);
    };
  }, []);

  return {
    session,
    logout: clearSession,
  };
}
