export type MachineStatus = "normal" | "warning" | "critical";
export type AlertSeverity = "info" | "warning" | "critical";
export type DashboardRole = "operator" | "manager" | "maintenance" | "producer" | "worker" | "supervisor";

export interface MachineReading {
  machine_id: string;
  temperature: number;
  vibration: number;
  timestamp: string;
  status: MachineStatus;
  pattern: "normal" | "manual_input" | "gradual_increase" | "sudden_spike";
}

export interface AiAssessment {
  anomaly_detected: boolean;
  high_temperature: boolean;
  abnormal_vibration: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
  priority_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  confidence: number;
  prediction_score: number;
  trend: "increasing" | "stable" | "decreasing";
  predicted_critical: boolean;
  signal_trends: Record<string, unknown>;
  explanation: string;
  reasons: string[];
  thresholds: {
    temperature_threshold: number;
    vibration_threshold: number;
    temperature_warning: number;
    vibration_warning: number;
  };
  metadata: Record<string, unknown>;
}

export interface BackendAlert {
  id: string;
  machine_id: string;
  severity: AlertSeverity;
  priority: "LOW" | "MEDIUM" | "HIGH";
  priority_score: number;
  prediction_score: number;
  trend: "increasing" | "stable" | "decreasing";
  root_cause: string;
  grouped_id: string;
  title: string;
  message: string;
  timestamp: string;
  status: MachineStatus;
  acknowledged: boolean;
  resolved: boolean;
  diagnostic_hint: string;
  reasons: string[];
  root_causes: string[];
  estimated_failure_minutes: number | null;
  downtime_cost_per_hour: number;
  safety_actions: string[];
  maintenance_ticket: {
    ticket_id: string;
    priority: string;
    assigned_team: string;
    status: string;
    recommended_action: string;
  };
  correlation_key: string;
  metadata: Record<string, unknown>;
}

export interface AuditEvent {
  id: string;
  alert_id: string;
  action: string;
  actor: string;
  timestamp: string;
  note: string;
}

export interface AlertBundle {
  active_alerts: BackendAlert[];
  filtered_alerts: BackendAlert[];
  grouped_alerts: Record<string, Record<string, BackendAlert[]>>;
  grouped_messages: Array<{
    machine_id: string;
    severity: AlertSeverity;
    count: number;
    root_cause?: string;
    grouped_id?: string;
    message: string;
  }>;
  alert_clusters?: Array<{
    id: string;
    machine_id: string;
    group: string;
    root_cause: string;
    severity: AlertSeverity;
    count: number;
    highest_priority_score: number;
    latest_timestamp: string;
  }>;
  mission_alerts: BackendAlert[];
  all_alerts: BackendAlert[];
  audit_log: AuditEvent[];
}

export interface LiveSnapshot {
  data: MachineReading;
  ai_assessment: AiAssessment;
  alerts: AlertBundle;
  recommendations: Recommendation[];
}

export interface AnalyzeInput {
  machine_id: string;
  temperature: number;
  vibration: number;
}

export interface AnalyzeResponse {
  input: MachineReading;
  ai_assessment: AiAssessment;
  alerts: AlertBundle;
  recommendations: Recommendation[];
}

export interface Recommendation {
  id: string;
  machine_id: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  action: string;
  rationale: string;
  owner: string;
}

export interface ManagerDashboard {
  role: DashboardRole;
  summary: {
    total_alerts: number;
    critical_count: number;
    warning_count: number;
    acknowledged_count: number;
    resolved_count: number;
  };
  mission_alerts: BackendAlert[];
}

export interface RoleDashboard {
  role: DashboardRole;
  [key: string]: unknown;
}

export interface HmiConfig {
  machine_type: string;
  layout: "grid" | "stack" | Array<{ section: string; widgets: string[] }>;
  widgets: Array<{
    id: string;
    title: string;
    type: "metric" | "alert_list" | "insight" | "trend_chart" | "recommendation_panel" | "alert_cluster" | string;
    source: string;
  }>;
  alerts: Array<{
    condition: string;
    threshold: number;
    message: string;
  }>;
}

export interface GenerateHmiInput {
  machine_type: string;
  signals: string[];
}

export interface RuntimeConfig {
  active_template: string;
  temperature_threshold: number;
  vibration_threshold: number;
  temperature_warning: number;
  vibration_warning: number;
  auto_hide_low_priority: boolean;
  focus_critical_only: boolean;
}

export interface ConfigResponse {
  config: RuntimeConfig;
  templates: Record<string, Record<string, unknown>>;
  machine_metadata: Record<string, Record<string, unknown>>;
}

export interface ThresholdRecommendation {
  recommended_temp_threshold: number;
  recommended_vibration_threshold: number;
  confidence: number;
}

export interface LoginInput {
  user_id: string;
  password: string;
  role: DashboardRole;
}

export interface LoginResponse {
  token: string;
  user: {
    user_id: string;
    display_name: string;
    role: DashboardRole;
  };
}

const DEFAULT_HTTP_URL = "http://127.0.0.1:8000";
const DEFAULT_WS_URL = "ws://127.0.0.1:8000";

declare global {
  interface Window {
    ADAPTIVE_HMI_CONFIG?: {
      BACKEND_HTTP_URL?: string;
      BACKEND_WS_URL?: string;
    };
  }
}

function runtimeConfig() {
  if (typeof window === "undefined") {
    return {};
  }
  return window.ADAPTIVE_HMI_CONFIG ?? {};
}

export const BACKEND_HTTP_URL =
  runtimeConfig().BACKEND_HTTP_URL?.replace(/\/$/, "")
  ?? import.meta.env.VITE_BACKEND_HTTP_URL?.replace(/\/$/, "")
  ?? DEFAULT_HTTP_URL;

export const BACKEND_WS_URL =
  runtimeConfig().BACKEND_WS_URL?.replace(/\/$/, "")
  ?? import.meta.env.VITE_BACKEND_WS_URL?.replace(/\/$/, "")
  ?? DEFAULT_WS_URL;

export async function getManagerDashboard(): Promise<ManagerDashboard> {
  const response = await fetch(`${BACKEND_HTTP_URL}/dashboard?role=manager`);
  if (!response.ok) {
    throw new Error(`Backend dashboard request failed with ${response.status}`);
  }
  return response.json();
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const response = await fetch(`${BACKEND_HTTP_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? `Login failed with ${response.status}`);
  }

  return response.json();
}

export async function getRoleDashboard(role: DashboardRole): Promise<RoleDashboard> {
  const response = await fetch(`${BACKEND_HTTP_URL}/dashboard?role=${role}`);
  if (!response.ok) {
    throw new Error(`Backend ${role} dashboard request failed with ${response.status}`);
  }
  return response.json();
}

export async function getAlerts(): Promise<AlertBundle & { ai_assessment: AiAssessment }> {
  const response = await fetch(`${BACKEND_HTTP_URL}/alerts`);
  if (!response.ok) {
    throw new Error(`Backend alerts request failed with ${response.status}`);
  }
  return response.json();
}

export async function analyzeMachine(input: AnalyzeInput): Promise<AnalyzeResponse> {
  const response = await fetch(`${BACKEND_HTTP_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Backend analysis request failed with ${response.status}`);
  }

  return response.json();
}

export async function updateAlertStatus(alertId: string, action: "acknowledge" | "resolve") {
  const response = await fetch(`${BACKEND_HTTP_URL}/alerts/${alertId}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor: "APEXVIHAG" }),
  });

  if (!response.ok) {
    throw new Error(`Alert ${action} failed with ${response.status}`);
  }

  return response.json();
}

export async function getGeneratedHmi(machineType: string): Promise<HmiConfig> {
  const response = await fetch(`${BACKEND_HTTP_URL}/generate-hmi/${machineType}`);
  if (!response.ok) {
    throw new Error(`Generated HMI request failed with ${response.status}`);
  }
  return response.json();
}

export async function generateAdaptiveHmi(input: GenerateHmiInput): Promise<HmiConfig> {
  const response = await fetch(`${BACKEND_HTTP_URL}/generate-hmi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Generated HMI request failed with ${response.status}`);
  }
  return response.json();
}

export async function getRecommendations(machineId: string): Promise<{ machine_id: string; recommendations: Recommendation[]; ai_assessment: AiAssessment }> {
  const response = await fetch(`${BACKEND_HTTP_URL}/recommendations?machine_id=${encodeURIComponent(machineId)}`);
  if (!response.ok) {
    throw new Error(`Recommendations request failed with ${response.status}`);
  }
  return response.json();
}

export async function getRuntimeConfig(): Promise<ConfigResponse> {
  const response = await fetch(`${BACKEND_HTTP_URL}/config`);
  if (!response.ok) {
    throw new Error(`Config request failed with ${response.status}`);
  }
  return response.json();
}

export async function updateRuntimeConfig(config: Partial<RuntimeConfig>): Promise<{ config: RuntimeConfig }> {
  const response = await fetch(`${BACKEND_HTTP_URL}/config/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    throw new Error(`Config update failed with ${response.status}`);
  }
  return response.json();
}

export async function getThresholdRecommendation(history: MachineReading[]): Promise<ThresholdRecommendation> {
  const response = await fetch(`${BACKEND_HTTP_URL}/ai/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history }),
  });
  if (!response.ok) {
    throw new Error(`AI recommendation failed with ${response.status}`);
  }
  return response.json();
}
