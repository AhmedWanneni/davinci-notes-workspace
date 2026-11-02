import React, { useState, useEffect } from "react";
import { Typography } from "@app/design-system";
import { Eye, EyeSlash, ShieldWarning, Check } from "@phosphor-icons/react";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import { createDesktopAISecretStore } from "../../ai/desktopAISecretStore";
import {
  getVaultIndexDb,
  getSetting,
  setSetting,
  withDbLock,
} from "../../vault";
import styles from "./SettingsDialog.module.scss";

export type AIListeningProviderId =
  "gemini" | "openai-compatible" | "openrouter" | "ollama";

export const AI_LISTENING_PROVIDER_KEY = "ai.listening.provider";
export const AI_LISTENING_MODEL_KEY = "ai.listening.model";
export const AI_LISTENING_THROTTLE_KEY = "ai.listening.throttle_sec";

export const DEFAULT_LISTENING_MODELS: Record<AIListeningProviderId, string> = {
  gemini: "gemini-2.0-flash",
  "openai-compatible": "gpt-4o-mini",
  openrouter: "openai/gpt-4o-mini",
  ollama: "gemma3",
};

export function AIListeningSettingsTab() {
  const [provider, setProvider] = useState<AIListeningProviderId>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(DEFAULT_LISTENING_MODELS.gemini);
  const [throttleSec, setThrottleSec] = useState("25");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const secretStore = createDesktopAISecretStore();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const db = await getVaultIndexDb().catch(() => null);
      if (!db) return;
      const [savedProv, savedModel, savedThrot] = await withDbLock(async () => [
        await getSetting(db, AI_LISTENING_PROVIDER_KEY),
        await getSetting(db, AI_LISTENING_MODEL_KEY),
        await getSetting(db, AI_LISTENING_THROTTLE_KEY),
      ]).catch(() => [null, null, null]);

      if (cancelled) return;
      const initialProv = (savedProv as AIListeningProviderId) || "gemini";
      setProvider(initialProv);
      setModel(
        savedModel ||
          DEFAULT_LISTENING_MODELS[initialProv] ||
          "gemini-2.0-flash",
      );
      if (savedThrot) setThrottleSec(savedThrot);

      const loadedKey =
        (await secretStore.load(`ai-listening:${initialProv}`)) ||
        (await secretStore.load(initialProv)) ||
        "";
      if (!cancelled) setApiKey(loadedKey);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleProviderChange = async (newProv: AIListeningProviderId) => {
    setProvider(newProv);
    const newModel = DEFAULT_LISTENING_MODELS[newProv] || "";
    setModel(newModel);
    const key =
      (await secretStore.load(`ai-listening:${newProv}`)) ||
      (await secretStore.load(newProv)) ||
      "";
    setApiKey(key);

    const db = await getVaultIndexDb().catch(() => null);
    if (db) {
      await withDbLock(async () => {
        await setSetting(db, AI_LISTENING_PROVIDER_KEY, newProv);
        await setSetting(db, AI_LISTENING_MODEL_KEY, newModel);
      }).catch(() => {});
    }
  };

  const handleSave = async () => {
    await secretStore.save(`ai-listening:${provider}`, apiKey);
    const db = await getVaultIndexDb().catch(() => null);
    if (db) {
      await withDbLock(async () => {
        await setSetting(db, AI_LISTENING_PROVIDER_KEY, provider);
        await setSetting(db, AI_LISTENING_MODEL_KEY, model.trim());
        await setSetting(db, AI_LISTENING_THROTTLE_KEY, throttleSec.trim());
      }).catch(() => {});
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div
      className={styles["settings-tab-content"]}
      data-testid="ai-listening-settings-tab"
    >
      <SettingsCard
        title="AI Listening Engine"
        description="Configure real-time stream summarization, question answering, and follow-up suggestion settings for live meetings."
      >
        <SettingsRow
          title="Provider"
          description="Select LLM provider for live streaming during meetings."
        >
          <select
            className={styles["settings-select"]}
            value={provider}
            onChange={(e) =>
              void handleProviderChange(e.target.value as AIListeningProviderId)
            }
            data-testid="ai-listening-provider-select"
          >
            <option value="gemini">Google Gemini</option>
            <option value="openai-compatible">OpenAI-compatible</option>
            <option value="openrouter">OpenRouter</option>
            <option value="ollama">Ollama (local)</option>
          </select>
        </SettingsRow>

        {provider === "gemini" && (
          <div
            className={styles["privacy-warning-banner"]}
            role="alert"
            data-testid="gemini-privacy-warning"
          >
            <ShieldWarning size={18} weight="fill" />
            <Typography variant="text" size="xs">
              Gemini free tier may use input audio/transcripts for product
              improvement. Use a paid tier API key or local Ollama for
              confidential conversations.
            </Typography>
          </div>
        )}

        <SettingsRow
          title="API Key"
          description="Stored securely in your OS keychain. Never persisted in plain text."
        >
          <div className={styles["api-key-input-group"]}>
            <input
              type={showKey ? "text" : "password"}
              className={styles["api-key-input"]}
              placeholder="Paste provider API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              data-testid="ai-listening-key-input"
            />
            <button
              type="button"
              className={styles["visibility-toggle-btn"]}
              onClick={() => setShowKey(!showKey)}
              title={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeSlash size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </SettingsRow>

        <SettingsRow
          title="Model"
          description="Model identifier for generating live meeting summaries and suggestions."
        >
          <input
            type="text"
            className={styles["api-key-input"]}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. gemini-2.0-flash or gpt-4o-mini"
            data-testid="ai-listening-model-input"
          />
        </SettingsRow>

        <SettingsRow
          title="Throttle Interval"
          description="Frequency (seconds) between AI summary updates. Minimum 15 seconds."
        >
          <select
            className={styles["settings-select"]}
            value={throttleSec}
            onChange={(e) => setThrottleSec(e.target.value)}
            data-testid="ai-listening-throttle-select"
          >
            <option value="15">15 seconds</option>
            <option value="20">20 seconds</option>
            <option value="25">25 seconds (Default)</option>
            <option value="30">30 seconds</option>
            <option value="45">45 seconds</option>
          </select>
        </SettingsRow>

        <div className={styles["settings-card-actions"]}>
          <button
            type="button"
            className={`${styles["btn"]} ${styles["btn--primary"]}`}
            onClick={() => void handleSave()}
            data-testid="ai-listening-save-btn"
          >
            {savedSuccess ? (
              <>
                <Check size={14} weight="bold" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save Settings</span>
            )}
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
