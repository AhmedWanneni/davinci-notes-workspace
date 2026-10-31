import { useState, useCallback, useEffect } from "react";
import {
  parseShortcuts,
  type AgentShortcut,
  SHORTCUTS_FILE_PATH,
} from "@app/ai-agent";
import {
  loadAIProviderStatus,
  loadSelectedProvider,
  loadProviderModels,
  loadOllamaBaseUrl,
  fetchOllamaModels,
  saveSelectedProvider,
  saveProviderModels,
  saveOllamaConfig,
  type AIProviderId,
} from "../../ai/AISubsystem";
import { loadAgentPreferences, saveAgentPreference } from "./agentPreferences";
import { readNote } from "../../vault/vaultCommands";

export function useAgentViewConfig() {
  const [currentProvider, setCurrentProvider] =
    useState<AIProviderId>("gemini");
  const [currentModel, setCurrentModel] = useState("gemini-2.0-flash");
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [autoApply, setAutoApply] = useState(true);
  const [rewriteEnabled, setRewriteEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConversationsOpen, setIsConversationsOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [selectedCliAgent, setSelectedCliAgent] = useState<string | null>(null);
  const [shortcuts, setShortcuts] = useState<AgentShortcut[]>([]);

  const checkProviderConfig = useCallback(async () => {
    try {
      const providerId = await loadSelectedProvider();
      setCurrentProvider(providerId);
      const models = await loadProviderModels(providerId);
      let activeChatModel = models.chatModel;
      if (providerId === "ollama") {
        const installed = await fetchOllamaModels();
        if (installed.length > 0 && !installed.includes(activeChatModel)) {
          const match = installed.find(
            (m) =>
              m.startsWith(activeChatModel) ||
              activeChatModel.startsWith(m.split(":")[0]),
          );
          activeChatModel = match ?? installed[0];
          const url = await loadOllamaBaseUrl();
          await saveOllamaConfig(url, models.embeddingModel, activeChatModel);
        }
      }
      setCurrentModel(activeChatModel);
      const prefs = await loadAgentPreferences();
      setAutoApply(prefs.autoApply);
      setWebSearchEnabled(prefs.webSearchEnabled);
      setRewriteEnabled(prefs.rewriteEnabled);
      const status = await loadAIProviderStatus(providerId);
      const ready = status === "ready";
      setIsConfigured(ready);
      if (!ready) setIsSettingsOpen(true);
    } catch {
      setIsConfigured(false);
      setIsSettingsOpen(true);
    }
  }, []);

  const loadShortcuts = useCallback(async () => {
    try {
      const file = await readNote(SHORTCUTS_FILE_PATH);
      setShortcuts(parseShortcuts(file.content).shortcuts);
    } catch {
      setShortcuts(parseShortcuts(null).shortcuts);
    }
  }, []);

  useEffect(() => {
    void checkProviderConfig();
    void loadShortcuts();
  }, [checkProviderConfig, loadShortcuts]);

  const handleModelSelect = useCallback(
    async (model: string, provider: AIProviderId) => {
      setCurrentModel(model);
      setCurrentProvider(provider);
      try {
        await saveSelectedProvider(provider);
        const models = await loadProviderModels(provider);
        if (provider === "ollama") {
          const url = await loadOllamaBaseUrl();
          await saveOllamaConfig(url, models.embeddingModel, model);
        } else {
          await saveProviderModels(provider, models.embeddingModel, model);
        }
      } catch (err) {
        console.warn("[agent] Failed to save model change:", err);
      }
    },
    [],
  );

  const handleToggleAutoApply = useCallback(async (enabled: boolean) => {
    setAutoApply(enabled);
    await saveAgentPreference("autoApply", enabled);
  }, []);

  const handleToggleWebSearch = useCallback(async (enabled: boolean) => {
    setWebSearchEnabled(enabled);
    await saveAgentPreference("webSearchEnabled", enabled);
  }, []);

  const handleToggleRewrite = useCallback(async (enabled: boolean) => {
    setRewriteEnabled(enabled);
    await saveAgentPreference("rewriteEnabled", enabled);
  }, []);

  return {
    currentProvider,
    setCurrentProvider,
    currentModel,
    setCurrentModel,
    webSearchEnabled,
    handleToggleWebSearch,
    autoApply,
    handleToggleAutoApply,
    rewriteEnabled,
    handleToggleRewrite,
    isSettingsOpen,
    setIsSettingsOpen,
    isConversationsOpen,
    setIsConversationsOpen,
    isConfigured,
    setIsConfigured,
    shortcuts,
    handleModelSelect,
    checkProviderConfig,
    selectedCliAgent,
    setSelectedCliAgent,
  };
}
