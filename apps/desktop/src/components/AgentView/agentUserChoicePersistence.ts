import { getSetting, getVaultIndexDb, setSetting, withDbLock } from "../../vault";

const STORAGE_KEY_CLI = "davinci.agent.selectedCliAgent";
const STORAGE_KEY_MODEL = "davinci.agent.selectedModel";
const STORAGE_KEY_PROVIDER = "davinci.agent.selectedProvider";

export interface AgentChoice {
  selectedCliAgent: string | null;
  selectedModel: string;
  selectedProvider: string;
}

export function getInitialAgentChoice(): AgentChoice {
  let selectedCliAgent: string | null = null;
  let selectedModel = "gemini-2.0-flash";
  let selectedProvider = "gemini";

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const savedCli = window.localStorage.getItem(STORAGE_KEY_CLI);
      if (savedCli !== null) {
        selectedCliAgent = savedCli.trim() ? savedCli.trim() : null;
      }
      const savedModel = window.localStorage.getItem(STORAGE_KEY_MODEL);
      if (savedModel && savedModel.trim()) {
        selectedModel = savedModel.trim();
      }
      const savedProvider = window.localStorage.getItem(STORAGE_KEY_PROVIDER);
      if (savedProvider && savedProvider.trim()) {
        selectedProvider = savedProvider.trim();
      }
    } catch {
      // Ignore local storage error
    }
  }

  return { selectedCliAgent, selectedModel, selectedProvider };
}

export async function persistAgentChoice(choice: Partial<AgentChoice>): Promise<void> {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (choice.selectedCliAgent !== undefined) {
        window.localStorage.setItem(
          STORAGE_KEY_CLI,
          choice.selectedCliAgent ? choice.selectedCliAgent.trim() : "",
        );
      }
      if (choice.selectedModel) {
        window.localStorage.setItem(STORAGE_KEY_MODEL, choice.selectedModel.trim());
      }
      if (choice.selectedProvider) {
        window.localStorage.setItem(STORAGE_KEY_PROVIDER, choice.selectedProvider.trim());
      }
    } catch {
      // Ignore storage error
    }
  }

  try {
    const db = await getVaultIndexDb();
    if (choice.selectedCliAgent !== undefined) {
      await withDbLock(() =>
        setSetting(db, "ai.agent.cliAgent", choice.selectedCliAgent ?? ""),
      );
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("davinci-ai-state-changed"));
    }
  } catch {
    // Non-Tauri fallback
  }
}

export async function loadAgentChoiceFromDb(): Promise<Partial<AgentChoice>> {
  try {
    const db = await getVaultIndexDb();
    const savedAgent = await withDbLock(() =>
      getSetting(db, "ai.agent.cliAgent"),
    );
    if (savedAgent !== null && savedAgent !== undefined) {
      const trimmed = savedAgent.trim();
      return { selectedCliAgent: trimmed || null };
    }
  } catch {
    // Non-Tauri fallback
  }
  return {};
}
