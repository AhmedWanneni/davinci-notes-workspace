import { useState, useEffect } from "react";
import { Button, Input, Typography } from "@app/design-system";
import {
  Sparkle,
  X,
  CheckCircle,
  WarningCircle,
  Cpu,
} from "@phosphor-icons/react";
import {
  saveSelectedProvider,
  validateAndSaveProviderKey,
  saveOllamaConfig,
  saveProviderModels,
  loadProviderModels,
  type AIProviderId,
} from "../../ai/AISubsystem";
import { PROVIDER_POPULAR_MODELS } from "./agentModelConstants";
import { AgentIntegrationsSection } from "./AgentIntegrationsSection";

export interface AgentSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: AIProviderId;
  onProviderChanged: (provider: AIProviderId) => void;
  currentModel?: string;
  onModelChanged?: (model: string) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: (enabled: boolean) => void;
  autoApply: boolean;
  onToggleAutoApply: (enabled: boolean) => void;
}

export function AgentSettingsPanel({
  isOpen,
  onClose,
  currentProvider,
  onProviderChanged,
  currentModel,
  onModelChanged,
  webSearchEnabled,
  onToggleWebSearch,
  autoApply,
  onToggleAutoApply,
}: AgentSettingsPanelProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<AIProviderId>(currentProvider);
  const [selectedModel, setSelectedModel] = useState(
    currentModel ||
      PROVIDER_POPULAR_MODELS[currentProvider]?.[0] ||
      "gemini-2.0-flash",
  );
  const [apiKey, setApiKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setSelectedProvider(currentProvider);
  }, [currentProvider]);

  useEffect(() => {
    if (currentModel) setSelectedModel(currentModel);
  }, [currentModel]);

  if (!isOpen) return null;

  const handleProviderSelect = (p: AIProviderId) => {
    setSelectedProvider(p);
    setFeedback(null);
    const defaults = PROVIDER_POPULAR_MODELS[p] ?? [];
    if (!defaults.includes(selectedModel)) {
      setSelectedModel(defaults[0] ?? "");
    }
  };

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      await saveSelectedProvider(selectedProvider);
      const activeModel =
        selectedModel.trim() || PROVIDER_POPULAR_MODELS[selectedProvider][0];
      if (selectedProvider === "ollama") {
        await saveOllamaConfig(ollamaUrl, "embeddinggemma", activeModel);
      } else {
        const models = await loadProviderModels(selectedProvider);
        await saveProviderModels(
          selectedProvider,
          models.embeddingModel,
          activeModel,
        );
        if (apiKey.trim()) {
          await validateAndSaveProviderKey(selectedProvider, apiKey.trim());
        }
      }
      onProviderChanged(selectedProvider);
      onModelChanged?.(activeModel);
      setFeedback({
        type: "success",
        text: "Successfully connected and saved!",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Connection failed. Please check your credentials.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const availableModels = PROVIDER_POPULAR_MODELS[selectedProvider] ?? [];

  return (
    <aside
      className="agent-settings-panel"
      role="region"
      aria-label="Agent Configuration"
    >
      <div className="agent-settings-panel__header">
        <div className="agent-settings-panel__title-group">
          <Sparkle size={18} weight="fill" />
          <Typography variant="text" size="base" weight="semibold">
            Agent Settings
          </Typography>
        </div>
        <button
          type="button"
          className="agent-settings-panel__close-btn"
          onClick={onClose}
          aria-label="Close settings"
        >
          <X size={16} />
        </button>
      </div>

      <div className="agent-settings-panel__body">
        <section className="agent-settings-panel__section">
          <Typography variant="text" size="xs" weight="semibold" color="muted">
            AI PROVIDER
          </Typography>
          <div className="agent-settings-panel__provider-grid">
            <button
              type="button"
              className={`agent-settings-panel__provider-btn${selectedProvider === "gemini" ? " is-active" : ""}`}
              onClick={() => handleProviderSelect("gemini")}
            >
              <span className="agent-settings-panel__provider-name">
                Google Gemini
              </span>
              <span className="agent-settings-panel__provider-sub">
                Fast, generous free tier
              </span>
            </button>
            <button
              type="button"
              className={`agent-settings-panel__provider-btn${selectedProvider === "ollama" ? " is-active" : ""}`}
              onClick={() => handleProviderSelect("ollama")}
            >
              <span className="agent-settings-panel__provider-name">
                Local Ollama
              </span>
              <span className="agent-settings-panel__provider-sub">
                100% offline & private
              </span>
            </button>
            <button
              type="button"
              className={`agent-settings-panel__provider-btn${selectedProvider === "openrouter" ? " is-active" : ""}`}
              onClick={() => handleProviderSelect("openrouter")}
            >
              <span className="agent-settings-panel__provider-name">
                OpenRouter
              </span>
              <span className="agent-settings-panel__provider-sub">
                Claude, GPT-4, Llama
              </span>
            </button>
          </div>
        </section>

        <section className="agent-settings-panel__section">
          <label className="agent-settings-panel__label">Active Model</label>
          <select
            className="agent-settings-panel__select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            aria-label="Select AI Model"
          >
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </section>

        <section className="agent-settings-panel__section">
          {selectedProvider === "ollama" ? (
            <div>
              <label className="agent-settings-panel__label">
                Ollama Server Endpoint
              </label>
              <Input
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
          ) : (
            <div>
              <label className="agent-settings-panel__label">API Key</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter ${selectedProvider === "gemini" ? "Gemini" : "OpenRouter"} API Key`}
              />
            </div>
          )}

          {feedback && (
            <div
              className={`agent-settings-panel__alert agent-settings-panel__alert--${feedback.type}`}
              role="alert"
            >
              {feedback.type === "success" ? (
                <CheckCircle size={15} />
              ) : (
                <WarningCircle size={15} />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveAndTest}
            disabled={isTesting}
            style={{ marginTop: "var(--space-2)" }}
          >
            <Cpu size={14} />
            {isTesting ? "Testing Connection..." : "Test & Save Connection"}
          </Button>
        </section>

        <AgentIntegrationsSection
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={onToggleWebSearch}
          autoApply={autoApply}
          onToggleAutoApply={onToggleAutoApply}
        />
      </div>
    </aside>
  );
}
