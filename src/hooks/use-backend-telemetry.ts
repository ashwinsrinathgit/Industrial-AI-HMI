import { useEffect, useMemo, useRef, useState } from "react";
import {
  BACKEND_WS_URL,
  type BackendAlert,
  type AnalyzeInput,
  type ConfigResponse,
  type DashboardRole,
  type HmiConfig,
  type LiveSnapshot,
  type ManagerDashboard,
  type RoleDashboard,
  type RuntimeConfig,
  type ThresholdRecommendation,
  analyzeMachine,
  getGeneratedHmi,
  getAlerts,
  getManagerDashboard,
  getRoleDashboard,
  getRuntimeConfig,
  getThresholdRecommendation,
  updateRuntimeConfig,
  updateAlertStatus,
} from "@/lib/backend";

interface TelemetryState {
  snapshot: LiveSnapshot | null;
  lastManualSnapshot: LiveSnapshot | null;
  readingHistory: LiveSnapshot["data"][];
  manager: ManagerDashboard | null;
  recentAlerts: BackendAlert[];
  roleData: Partial<Record<DashboardRole, RoleDashboard>>;
  hmiConfig: HmiConfig | null;
  runtimeConfig: ConfigResponse | null;
  recommendation: ThresholdRecommendation | null;
  manualModeUntil: number;
  connected: boolean;
  error: string | null;
}

const TELEMETRY_STORAGE_KEY = "adaptive-hmi-telemetry-state";

function isBrowser() {
  return typeof window !== "undefined";
}

function loadSavedTelemetryState(): Pick<
  TelemetryState,
  "snapshot" | "lastManualSnapshot" | "readingHistory" | "recentAlerts" | "manualModeUntil"
> {
  const empty = {
    snapshot: null,
    lastManualSnapshot: null,
    readingHistory: [],
    recentAlerts: [],
    manualModeUntil: 0,
  };

  if (!isBrowser()) {
    return empty;
  }

  try {
    const raw = window.sessionStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) {
      return empty;
    }

    const saved = JSON.parse(raw) as Partial<TelemetryState>;
    const manualModeActive = Date.now() < Number(saved.manualModeUntil ?? 0);
    const lastManualSnapshot = saved.lastManualSnapshot ?? null;
    return {
      snapshot: manualModeActive ? lastManualSnapshot : saved.snapshot ?? null,
      lastManualSnapshot,
      readingHistory: Array.isArray(saved.readingHistory) ? saved.readingHistory.slice(-24) : [],
      recentAlerts: Array.isArray(saved.recentAlerts) ? saved.recentAlerts.slice(0, 50) : [],
      manualModeUntil: Number(saved.manualModeUntil ?? 0),
    };
  } catch {
    return empty;
  }
}

function saveTelemetryState(
  values: Pick<TelemetryState, "snapshot" | "lastManualSnapshot" | "readingHistory" | "recentAlerts" | "manualModeUntil">,
) {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(
    TELEMETRY_STORAGE_KEY,
    JSON.stringify({
      snapshot: values.snapshot,
      lastManualSnapshot: values.lastManualSnapshot,
      readingHistory: values.readingHistory.slice(-24),
      recentAlerts: values.recentAlerts.slice(0, 50),
      manualModeUntil: values.manualModeUntil,
    }),
  );
}

function appendReadingHistory(
  history: LiveSnapshot["data"][],
  reading: LiveSnapshot["data"],
  limit = 24,
) {
  const last = history[history.length - 1];
  if (last?.timestamp === reading.timestamp) {
    return history;
  }
  return [...history, reading].slice(-limit);
}

function activeAlertsFromBundle(alerts: { active_alerts?: BackendAlert[]; filtered_alerts: BackendAlert[] }) {
  return (alerts.active_alerts?.length ? alerts.active_alerts : alerts.filtered_alerts).filter(
    (alert) => !alert.resolved,
  );
}

export function useBackendTelemetry() {
  const [state, setState] = useState<TelemetryState>(() => {
    const saved = loadSavedTelemetryState();
    return {
    snapshot: saved.snapshot,
    lastManualSnapshot: saved.lastManualSnapshot,
    readingHistory: saved.readingHistory,
    manager: null,
    recentAlerts: saved.recentAlerts,
    roleData: {},
    hmiConfig: null,
    runtimeConfig: null,
    recommendation: null,
    manualModeUntil: saved.manualModeUntil,
    connected: false,
    error: null,
    };
  });
  const manualModeUntilRef = useRef(state.manualModeUntil);

  useEffect(() => {
    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let summaryTimer: number | undefined;

    const refreshSummary = async () => {
      try {
        const roles: DashboardRole[] = ["producer", "worker", "supervisor", "operator", "manager", "maintenance"];
        const [manager, alerts, roleResponses, hmiConfig, runtimeConfig] = await Promise.all([
          getManagerDashboard(),
          getAlerts(),
          Promise.all(roles.map((role) => getRoleDashboard(role))),
          getGeneratedHmi("motor_standard"),
          getRuntimeConfig(),
        ]);
        if (cancelled) return;
        const roleData = Object.fromEntries(
          roleResponses.map((payload) => [payload.role, payload]),
        ) as Partial<Record<DashboardRole, RoleDashboard>>;
        setState((current) => ({
          ...current,
          manager,
          recentAlerts:
            Date.now() < manualModeUntilRef.current
              ? current.recentAlerts
              : activeAlertsFromBundle(alerts),
          roleData,
          hmiConfig,
          runtimeConfig,
          error: null,
        }));
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : "Backend request failed",
        }));
      }
    };

    const connect = () => {
      socket = new WebSocket(`${BACKEND_WS_URL}/ws/live`);

      socket.onopen = () => {
        if (cancelled) return;
        setState((current) => ({ ...current, connected: true, error: null }));
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        const snapshot = JSON.parse(event.data) as LiveSnapshot;
        setState((current) => {
          if (Date.now() < manualModeUntilRef.current) {
            return {
              ...current,
              connected: true,
              error: null,
            };
          }

          const liveAlerts = activeAlertsFromBundle(snapshot.alerts);
          const readingHistory = appendReadingHistory(current.readingHistory, snapshot.data);
          const nextState = {
            ...current,
            snapshot,
            readingHistory,
            recentAlerts: liveAlerts,
            connected: true,
            error: null,
          };
          saveTelemetryState(nextState);
          return nextState;
        });
      };

      socket.onerror = () => {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          connected: false,
          error: "Live backend stream is unavailable",
        }));
      };

      socket.onclose = () => {
        if (cancelled) return;
        setState((current) => ({ ...current, connected: false }));
        reconnectTimer = window.setTimeout(connect, 3000);
      };
    };

    void refreshSummary();
    connect();
    summaryTimer = window.setInterval(refreshSummary, 5000);

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (summaryTimer) window.clearInterval(summaryTimer);
      socket?.close();
    };
  }, []);

  const analyze = async (input: AnalyzeInput) => {
    setState((current) => ({ ...current, error: null }));
    try {
      const result = await analyzeMachine(input);
      const manualModeUntil = Date.now() + 20000;
      manualModeUntilRef.current = manualModeUntil;
      const snapshot: LiveSnapshot = {
        data: result.input,
        ai_assessment: result.ai_assessment,
        alerts: result.alerts,
      };
      setState((current) => {
        const nextState = {
          ...current,
          snapshot,
          lastManualSnapshot: snapshot,
          readingHistory: appendReadingHistory(current.readingHistory, snapshot.data),
          recentAlerts: activeAlertsFromBundle(result.alerts),
          manualModeUntil,
          error: null,
        };
        saveTelemetryState(nextState);
        return nextState;
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Backend analysis failed";
      setState((current) => ({ ...current, error: message }));
      throw error;
    }
  };

  const updateAlert = async (alertId: string, action: "acknowledge" | "resolve") => {
    await updateAlertStatus(alertId, action);
    const alerts = await getAlerts();
    setState((current) => ({
      ...current,
      recentAlerts: activeAlertsFromBundle(alerts),
      snapshot: current.snapshot
        ? {
            ...current.snapshot,
            ai_assessment: alerts.ai_assessment,
            alerts,
          }
        : current.snapshot,
      error: null,
    }));
  };

  const updateConfig = async (config: Partial<RuntimeConfig>) => {
    const updated = await updateRuntimeConfig(config);
    const runtimeConfig = await getRuntimeConfig();
    setState((current) => ({
      ...current,
      runtimeConfig: { ...runtimeConfig, config: updated.config },
      error: null,
    }));
    return updated.config;
  };

  const recommendThresholds = async () => {
    const history = state.recentAlerts.slice(0, 10).map((alert) => ({
      machine_id: alert.machine_id,
      temperature: Number(alert.metadata?.temperature ?? state.snapshot?.data.temperature ?? 70),
      vibration: Number(alert.metadata?.vibration ?? state.snapshot?.data.vibration ?? 1.5),
      timestamp: alert.timestamp,
      status: alert.status,
      pattern: state.snapshot?.data.pattern ?? "manual_input",
    }));
    const recommendation = await getThresholdRecommendation(
      history.length ? history : state.snapshot ? [state.snapshot.data] : [],
    );
    setState((current) => ({ ...current, recommendation, error: null }));
    return recommendation;
  };

  return useMemo(
    () => ({ ...state, analyze, updateAlert, updateConfig, recommendThresholds }),
    [state],
  );
}
