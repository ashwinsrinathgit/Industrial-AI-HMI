import type { DashboardRole, LoginResponse } from "@/lib/backend";

const SESSION_KEY = "adaptive-hmi-session";

export interface AppSession {
  token: string;
  user: LoginResponse["user"];
}

export function getSession(): AppSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AppSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AppSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("adaptive-hmi-session-change"));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("adaptive-hmi-session-change"));
}

export function roleLabel(role: DashboardRole) {
  return role.slice(0, 1).toUpperCase() + role.slice(1);
}
