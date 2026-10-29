import { useState } from "react";
import { Button, Typography, Input } from "@app/design-system";
import { Sparkle, CheckCircle, WarningCircle, ArrowSquareOut } from "@phosphor-icons/react";
import {
  saveSelectedProvider,
  validateAndSaveProviderKey,
  saveOllamaConfig,
  type AIProviderId,
} from "../../ai/AISubsystem";

export interface AgentOnboardingCardProps {
  onConfigured: () => void;
}

export function AgentOnboardingCard({ onConfigured }: AgentOnboardingCardProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConnect = async () => {
    setIsTesting(true);
    setError(null);
    try {
      await saveSelectedProvider(selectedProvider);
      if (selectedProvider === "ollama") {
        await saveOllamaConfig(ollamaUrl, "embeddinggemma", "gemma3");
      } else {
        if (!apiKey.trim()) {
          throw new Error("Please enter your API key to continue.");
        }
        await validateAndSaveProviderKey(selectedProvider, apiKey.trim());
      }
      setSuccess(true);
      setTimeout(() => {
        onConfigured();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed. Please check your key or URL.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="agent-onboarding-card" role="region" aria-label="AI Agent Setup">
      <div className="agent-onboarding-card__header">
        <Sparkle size={28} weight="fill" className="agent-onboarding-card__sparkle" />
        <Typography variant="text" size="lg" weight="bold">
          Set Up Your AI Agent
        </Typography>
        <Typography variant="text" size="xs" color="muted">
          Connect an AI provider to talk to your vault. Your notes stay private and local.
        </Typography>
      </div>

      <div className="agent-onboarding-card__options">
        <button
          type="button"
          className={`agent-onboarding-card__opt${selectedProvider === "gemini" ? " agent-onboarding-card__opt--selected" : ""}`}
          onClick={() => { setSelectedProvider("gemini"); setError(null); }}
        >
          <div className="agent-onboarding-card__opt-title">Google Gemini</div>
          <div className="agent-onboarding-card__opt-desc">Free tier with generous limits. Recommended.</div>
        </button>

        <button
          type="button"
          className={`agent-onboarding-card__opt${selectedProvider === "openrouter" ? " agent-onboarding-card__opt--selected" : ""}`}
          onClick={() => { setSelectedProvider("openrouter"); setError(null); }}
        >
          <div className="agent-onboarding-card__opt-title">OpenRouter</div>
          <div className="agent-onboarding-card__opt-desc">Pay-as-you-go access to Claude, GPT-4, and Llama.</div>
        </button>

        <button
          type="button"
          className={`agent-onboarding-card__opt${selectedProvider === "ollama" ? " agent-onboarding-card__opt--selected" : ""}`}
          onClick={() => { setSelectedProvider("ollama"); setError(null); }}
        >
          <div className="agent-onboarding-card__opt-title">Local Ollama</div>
          <div className="agent-onboarding-card__opt-desc">100% offline on your machine. Zero cloud transfer.</div>
        </button>
      </div>

      <div className="agent-onboarding-card__fields">
        {selectedProvider === "ollama" ? (
          <div>
            <label className="agent-onboarding-card__label">Ollama Server Address</label>
            <Input
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
            />
          </div>
        ) : (
          <div>
            <div className="agent-onboarding-card__key-label-row">
              <label className="agent-onboarding-card__label">API Key</label>
              {selectedProvider === "gemini" && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="agent-onboarding-card__link"
                >
                  Get free Gemini key <ArrowSquareOut size={11} />
                </a>
              )}
            </div>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Paste your ${selectedProvider === "gemini" ? "Google AI Studio" : "OpenRouter"} key`}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="agent-onboarding-card__alert agent-onboarding-card__alert--error">
          <WarningCircle size={15} weight="fill" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="agent-onboarding-card__alert agent-onboarding-card__alert--success">
          <CheckCircle size={15} weight="fill" />
          <span>Connected successfully! Launching agent...</span>
        </div>
      )}

      <div className="agent-onboarding-card__footer">
        <Button
          variant="primary"
          onClick={() => void handleConnect()}
          disabled={isTesting || success}
        >
          {isTesting ? "Testing Connection..." : "Save and Start Talking"}
        </Button>
      </div>
    </div>
  );
}
