import { useState } from "react";
import { Button, Input, Typography } from "@app/design-system";
import {
  Sparkle,
  X,
  CheckCircle,
  WarningCircle,
  Globe,
  CalendarCheck,
  Cpu,
} from "@phosphor-icons/react";
import {
  saveSelectedProvider,
  validateAndSaveProviderKey,
  saveOllamaConfig,
  type AIProviderId,
} from "../../ai/AISubsystem";

export interface AgentSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: AIProviderId;
  onProviderChanged: (provider: AIProviderId) => void;
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
  webSearchEnabled,
  onToggleWebSearch,
  autoApply,
  onToggleAutoApply,
}: AgentSettingsPanelProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>(currentProvider);
  const [apiKey, setApiKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      await saveSelectedProvider(selectedProvider);
      if (selectedProvider === "ollama") {
        await saveOllamaConfig(ollamaUrl, "embeddinggemma", "gemma3");
      } else {
        if (!apiKey.trim()) {
          throw new Error("Please enter your API key to test connection.");
        }
        await validateAndSaveProviderKey(selectedProvider, apiKey.trim());
      }
      onProviderChanged(selectedProvider);
      setFeedback({ type: "success", text: "Successfully connected and saved!" });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Connection failed. Please check your credentials.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <aside className="agent-settings-panel" role="region" aria-label="Agent Configuration">
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
        {/* Provider Selection */}
        <section className="agent-settings-panel__section">
          <Typography variant="text" size="xs" weight="semibold" color="muted">
            AI PROVIDER
          </Typography>
          <div className="agent-settings-panel__provider-grid">
            <button
              type="button"
              className={`agent-settings-panel__provider-btn${selectedProvider === "gemini" ? " is-active" : ""}`}
              onClick={() => { setSelectedProvider("gemini"); setFeedback(null); }}
            >
              <span className="agent-settings-panel__provider-name">Google Gemini</span>
              <span className="agent-settings-panel__provider-sub">Fast, generous free tier</span>
            </button>
            <button
              type="button"
              className={`agent-settings-panel__provider-btn${selectedProvider === "ollama" ? " is-active" : ""}`}
              onClick={() => { setSelectedProvider("ollama"); setFeedback(null); }}
            >
              <span className="agent-settings-panel__provider-name">Local Ollama</span>
              <span className="agent-settings-panel__provider-sub">100% offline & private</span>
            </button>
            <button
              type="button"
              className={`agent-settings-panel__provider-btn${selectedProvider === "openrouter" ? " is-active" : ""}`}
              onClick={() => { setSelectedProvider("openrouter"); setFeedback(null); }}
            >
              <span className="agent-settings-panel__provider-name">OpenRouter</span>
              <span className="agent-settings-panel__provider-sub">Claude, GPT-4, Llama</span>
            </button>
          </div>
        </section>

        {/* Credentials / URL */}
        <section className="agent-settings-panel__section">
          {selectedProvider === "ollama" ? (
            <div>
              <label className="agent-settings-panel__label">Ollama Server Endpoint</label>
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
              {feedback.type === "success" ? <CheckCircle size={15} /> : <WarningCircle size={15} />}
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

        {/* Capabilities Toggles */}
        <section className="agent-settings-panel__section">
          <Typography variant="text" size="xs" weight="semibold" color="muted">
            INTEGRATIONS & CAPABILITIES
          </Typography>

          <div className="agent-settings-panel__toggle-row">
            <div className="agent-settings-panel__toggle-info">
              <Globe size={16} />
              <div>
                <div className="agent-settings-panel__toggle-title">Web Search</div>
                <div className="agent-settings-panel__toggle-desc">Allow agent to research queries online</div>
              </div>
            </div>
            <button
              type="button"
              className={`agent-settings-panel__switch${webSearchEnabled ? " is-on" : ""}`}
              onClick={() => onToggleWebSearch(!webSearchEnabled)}
              aria-label="Toggle web search"
            >
              <div className="agent-settings-panel__switch-knob" />
            </button>
          </div>

          <div className="agent-settings-panel__toggle-row">
            <div className="agent-settings-panel__toggle-info">
              <CalendarCheck size={16} />
              <div>
                <div className="agent-settings-panel__toggle-title">Google Calendar</div>
                <div className="agent-settings-panel__toggle-desc">Sync tasks and meeting notes</div>
              </div>
            </div>
            <Typography variant="text" size="xs" color="muted">
              Connected
            </Typography>
          </div>

          <div className="agent-settings-panel__toggle-row">
            <div className="agent-settings-panel__toggle-info">
              <Sparkle size={16} />
              <div>
                <div className="agent-settings-panel__toggle-title">Auto-apply Vault Changes</div>
                <div className="agent-settings-panel__toggle-desc">Directly write files instead of staging diffs</div>
              </div>
            </div>
            <button
              type="button"
              className={`agent-settings-panel__switch${autoApply ? " is-on" : ""}`}
              onClick={() => onToggleAutoApply(!autoApply)}
              aria-label="Toggle auto-apply"
            >
              <div className="agent-settings-panel__switch-knob" />
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
