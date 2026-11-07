import { MODEL_CONTEXT_WINDOWS } from "./agentTokenEstimator";

export interface ModelUsageRecord {
  id: string;
  name: string;
  type: "cli_agent" | "cloud_model" | "local_model";
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  contextWindow: number;
  lastUsedAt?: number;
}

export interface AgentUsageReport {
  models: Record<string, ModelUsageRecord>;
  lifetimeTotalTokens: number;
  lifetimeTotalRequests: number;
}

const STORAGE_KEY = "davinci.agent.usage_stats";

const BASE_RECORDS: ModelUsageRecord[] = [
  {
    id: "agy",
    name: "Antigravity CLI (agy)",
    type: "cli_agent",
    totalRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    contextWindow: MODEL_CONTEXT_WINDOWS.agy,
  },
  {
    id: "codex",
    name: "Codex CLI",
    type: "cli_agent",
    totalRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    contextWindow: MODEL_CONTEXT_WINDOWS.codex,
  },
  {
    id: "claude",
    name: "Claude Code",
    type: "cli_agent",
    totalRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    contextWindow: MODEL_CONTEXT_WINDOWS.claude,
  },
  {
    id: "opencode",
    name: "OpenCode",
    type: "cli_agent",
    totalRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    contextWindow: MODEL_CONTEXT_WINDOWS.opencode,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    type: "cloud_model",
    totalRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    contextWindow: MODEL_CONTEXT_WINDOWS["gemini-2.0-flash"],
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    type: "cloud_model",
    totalRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    contextWindow: MODEL_CONTEXT_WINDOWS["gemini-1.5-pro"],
  },
  {
    id: "claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet",
    type: "cloud_model",
    totalRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    contextWindow: MODEL_CONTEXT_WINDOWS["claude-3-7-sonnet"],
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    type: "cloud_model",
    totalRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    contextWindow: MODEL_CONTEXT_WINDOWS["gpt-4o"],
  },
  {
    id: "ollama-local",
    name: "Ollama Local Models",
    type: "local_model",
    totalRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    contextWindow: MODEL_CONTEXT_WINDOWS.default,
  },
];

function createDefaultReport(): AgentUsageReport {
  const models: Record<string, ModelUsageRecord> = {};
  for (const r of BASE_RECORDS) {
    models[r.id] = { ...r };
  }
  return {
    models,
    lifetimeTotalTokens: 0,
    lifetimeTotalRequests: 0,
  };
}

export function loadAgentUsageReport(): AgentUsageReport {
  if (typeof window === "undefined" || !window.localStorage) {
    return createDefaultReport();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultReport();
    const parsed = JSON.parse(raw) as AgentUsageReport;
    const report = createDefaultReport();
    if (parsed.models) {
      for (const [k, v] of Object.entries(parsed.models)) {
        if (report.models[k]) {
          report.models[k] = { ...report.models[k], ...v };
        } else {
          report.models[k] = v;
        }
      }
    }
    report.lifetimeTotalTokens = parsed.lifetimeTotalTokens ?? 0;
    report.lifetimeTotalRequests = parsed.lifetimeTotalRequests ?? 0;
    return report;
  } catch {
    return createDefaultReport();
  }
}

export function recordAgentUsage(params: {
  id: string;
  name?: string;
  type?: "cli_agent" | "cloud_model" | "local_model";
  inputTokens: number;
  outputTokens: number;
}): void {
  const { id, name, type, inputTokens, outputTokens } = params;
  const report = loadAgentUsageReport();

  const totalTokens = inputTokens + outputTokens;
  const existing = report.models[id] || {
    id,
    name: name || id,
    type: type || "cloud_model",
    totalRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    contextWindow: MODEL_CONTEXT_WINDOWS[id] || MODEL_CONTEXT_WINDOWS.default,
  };

  existing.totalRequests += 1;
  existing.inputTokens += inputTokens;
  existing.outputTokens += outputTokens;
  existing.totalTokens += totalTokens;
  existing.lastUsedAt = Date.now();

  report.models[id] = existing;
  report.lifetimeTotalTokens += totalTokens;
  report.lifetimeTotalRequests += 1;

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
      window.dispatchEvent(new Event("davinci-agent-usage-updated"));
    } catch {
      // Ignore storage write failure
    }
  }
}

export function clearAgentUsageReport(): void {
  const fresh = createDefaultReport();
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      window.dispatchEvent(new Event("davinci-agent-usage-updated"));
    } catch {
      // Ignore storage write failure
    }
  }
}
