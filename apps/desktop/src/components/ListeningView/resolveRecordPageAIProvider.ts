import type { AIProvider, ChatRequest, ChatResponse } from "@app/ai-api";
import { useAgentStore } from "../AgentView/useAgentStore";
import {
  detectCliAgents,
  startCliAgentSession,
  subscribeCliAgentStream,
} from "../AgentView/cliAgentBridge";
import { CLI_AGENT_CATALOG, type CliAgentId } from "../AgentView/cliAgentTypes";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { loadAISubsystem } from "../../ai/loadAISubsystem";
import { createDesktopAISecretStore } from "../../ai/desktopAISecretStore";
import { getVaultIndexDb, getSetting, withDbLock } from "../../vault";
import {
  AI_LISTENING_PROVIDER_KEY,
  AI_LISTENING_MODEL_KEY,
  type AIListeningProviderId,
} from "../SettingsDialog/AIListeningSettingsTab";

export function getActiveRecordAgentLabel(): string {
  const { selectedCliAgent, cliAgentModels, selectedModel } =
    useAgentStore.getState();
  if (selectedCliAgent) {
    const meta = CLI_AGENT_CATALOG[selectedCliAgent as CliAgentId];
    const modId = cliAgentModels[selectedCliAgent] || meta?.defaultModel;
    const modLabel = meta?.models.find((m) => m.id === modId)?.label || modId;
    const shortName = meta?.name.split(" ")[0] || selectedCliAgent;
    return modLabel ? `${shortName} · ${modLabel}` : shortName;
  }
  if (selectedModel === "gemini-2.0-flash") return "Sophia · Gemini 2.0 Flash";
  if (selectedModel === "gemini-1.5-pro") return "Sophia · Gemini 1.5 Pro";
  if (selectedModel === "openai/gpt-4o-mini") return "Sophia · GPT-4o Mini";
  if (selectedModel === "anthropic/claude-3.5-haiku")
    return "Sophia · Claude 3.5 Haiku";
  return `Sophia · ${selectedModel || "Assistant"}`;
}

export async function runCliAgentCompletion(
  agentId: CliAgentId,
  prompt: string,
): Promise<string> {
  const vaultPath = useWorkspaceStore.getState().vaultPath || ".";
  const sessionId = `rec_cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  let accumulated = "";

  return new Promise<string>((resolve, reject) => {
    let unlisten: (() => void) | null = null;
    const cleanup = () => {
      if (unlisten) {
        unlisten();
        unlisten = null;
      }
    };

    void subscribeCliAgentStream(sessionId, (ev) => {
      if (ev.kind === "text") {
        accumulated += (accumulated ? "\n" : "") + ev.content;
      } else if (ev.kind === "done") {
        cleanup();
        resolve(accumulated.trim() || ev.content.trim());
      } else if (ev.kind === "error" && !accumulated) {
        cleanup();
        reject(new Error(ev.content || `${agentId} execution failed`));
      }
    })
      .then((unsub) => {
        unlisten = unsub;
        return startCliAgentSession(sessionId, agentId, prompt, vaultPath);
      })
      .catch((err) => {
        cleanup();
        reject(err);
      });
  });
}

function createCliProviderAdapter(agentId: CliAgentId): AIProvider {
  return {
    id: `cli:${agentId}`,
    complete: async (req: ChatRequest): Promise<ChatResponse> => {
      const combinedPrompt = req.messages
        .map((m) =>
          m.role === "system"
            ? `[System Instructions]\n${m.content}`
            : m.content,
        )
        .join("\n\n");
      const content = await runCliAgentCompletion(agentId, combinedPrompt);
      return { content, model: agentId };
    },
    stream: async function* (req: ChatRequest) {
      const res = await this.complete(req);
      yield { delta: res.content, done: true };
    },
    embed: async () => ({ embeddings: [], model: agentId }),
    dispose: async () => {},
  };
}

async function createGroqChatProvider(model?: string): Promise<AIProvider | null> {
  const secretStore = createDesktopAISecretStore();
  const apiKey =
    (await secretStore.load("ai-listening:groq")) ||
    (await secretStore.load("ai-transcription:groq")) ||
    (await secretStore.load("groq")) ||
    "";
  if (!apiKey) return null;

  const targetModel = model || "llama-3.3-70b-versatile";
  return {
    id: "groq",
    complete: async (req: ChatRequest): Promise<ChatResponse> => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages: req.messages,
          temperature: req.temperature ?? 0.2,
        }),
        signal: req.signal,
      });
      if (!res.ok) {
        throw new Error(`Groq request failed (HTTP ${res.status})`);
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim() || "";
      return { content, model: targetModel };
    },
    stream: async function* (req: ChatRequest) {
      const res = await this.complete(req);
      yield { delta: res.content, done: true };
    },
    embed: async () => ({ embeddings: [], model: targetModel }),
    dispose: async () => {},
  };
}

export async function resolveRecordPageAIProvider(): Promise<AIProvider> {
  const agentState = useAgentStore.getState();

  // 1. If user explicitly selected a CLI agent on the AI Agent page, use it
  if (agentState.selectedCliAgent) {
    return createCliProviderAdapter(agentState.selectedCliAgent as CliAgentId);
  }

  // 2. Determine provider & model from Settings or AI Agent store
  const db = await getVaultIndexDb().catch(() => null);
  let savedProvider: string | null = null;
  let savedModel: string | null = null;
  if (db) {
    [savedProvider, savedModel] = await withDbLock(async () => [
      await getSetting(db, AI_LISTENING_PROVIDER_KEY),
      await getSetting(db, AI_LISTENING_MODEL_KEY),
    ]).catch(() => [null, null]);
  }

  const providerId = (savedProvider ||
    agentState.selectedProvider ||
    "gemini") as AIListeningProviderId;
  const modelOverride = savedModel || agentState.selectedModel || undefined;

  if (providerId === "groq") {
    const groqProv = await createGroqChatProvider(modelOverride);
    if (groqProv) return groqProv;
  }

  const ai = await loadAISubsystem();
  try {
    return await ai.createConfiguredProvider(providerId as any, modelOverride);
  } catch {
    try {
      const current = await ai.loadSelectedProvider();
      return await ai.createConfiguredProvider(current, modelOverride);
    } catch (fallbackErr) {
      // 3. Fallback to Groq if a free Groq key is present, or first installed CLI agent from AI Agent page
      const groqProv = await createGroqChatProvider();
      if (groqProv) return groqProv;

      const cliList = await detectCliAgents().catch(() => []);
      const installed = cliList.find((a) => a.installed);
      if (installed) {
        return createCliProviderAdapter(installed.id);
      }
      throw fallbackErr;
    }
  }
}
