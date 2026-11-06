import React, { useState, useEffect } from "react";
import { Typography } from "@app/design-system";
import { Eye, EyeSlash, Check, Broadcast } from "@phosphor-icons/react";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import { createDesktopAISecretStore } from "../../ai/desktopAISecretStore";
import {
  detectTranscriptionTools,
  GROQ_WHISPER_MODELS,
  type FreeTranscriptionEngine,
  type TranscriptionToolsStatus,
} from "../../adapters/transcriptionClient";
import {
  getVaultIndexDb,
  getSetting,
  setSetting,
  withDbLock,
} from "../../vault";
import styles from "./SettingsDialog.module.scss";

export const AI_TRANSCRIPTION_ENGINE_KEY = "ai.transcription.engine";
export const AI_TRANSCRIPTION_MODEL_KEY = "ai.transcription.model";
export const AI_TRANSCRIPTION_ENDPOINT_KEY = "ai.transcription.endpoint";

export function TranscriptionSettingsCard() {
  const [engine, setEngine] = useState<FreeTranscriptionEngine>("auto");
  const [whisperModel, setWhisperModel] = useState<string>(
    "whisper-large-v3-turbo",
  );
  const [groqApiKey, setGroqApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toolsStatus, setToolsStatus] =
    useState<TranscriptionToolsStatus | null>(null);

  const secretStore = createDesktopAISecretStore();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const status = await detectTranscriptionTools();
      if (!cancelled) setToolsStatus(status);

      const db = await getVaultIndexDb().catch(() => null);
      if (db) {
        const [savedEngine, savedModel] = await withDbLock(async () => [
          await getSetting(db, AI_TRANSCRIPTION_ENGINE_KEY),
          await getSetting(db, AI_TRANSCRIPTION_MODEL_KEY),
        ]).catch(() => [null, null]);

        if (!cancelled) {
          if (savedEngine) setEngine(savedEngine as FreeTranscriptionEngine);
          if (savedModel) setWhisperModel(savedModel);
        }
      }

      const loadedGroqKey =
        (await secretStore.load("ai-transcription:groq")) ||
        (await secretStore.load("groq")) ||
        (await secretStore.load("whisper")) ||
        "";
      if (!cancelled && loadedGroqKey) {
        setGroqApiKey(loadedGroqKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveTranscription = async () => {
    const trimmedKey = groqApiKey.trim();
    if (trimmedKey) {
      await secretStore.save("ai-transcription:groq", trimmedKey);
      await secretStore.save("groq", trimmedKey);
      await secretStore.save("whisper", trimmedKey);
    }

    const db = await getVaultIndexDb().catch(() => null);
    if (db) {
      await withDbLock(async () => {
        await setSetting(db, AI_TRANSCRIPTION_ENGINE_KEY, engine);
        await setSetting(db, AI_TRANSCRIPTION_MODEL_KEY, whisperModel);
      }).catch(() => {});
    }

    const status = await detectTranscriptionTools();
    setToolsStatus(status);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <SettingsCard
      title="Speech-to-Text Transcript (Free Tools & Groq Whisper)"
      description="Configure free speech-to-text transcription using Groq Whisper (free tier), local offline Whisper CLI, or built-in Web Speech."
    >
      <SettingsRow
        title="Transcription Engine"
        description="Auto mode uses Groq Whisper when a free key is set, falling back to Local Whisper CLI and Web Speech."
      >
        <select
          className={styles["settings-select"]}
          value={engine}
          onChange={(e) =>
            setEngine(e.target.value as FreeTranscriptionEngine)
          }
          data-testid="ai-transcription-engine-select"
        >
          <option value="auto">
            Auto (Groq Whisper Free → Local Whisper → Web Speech)
          </option>
          <option value="groq-whisper">
            Groq Whisper (Free Cloud API — whisper-large-v3-turbo)
          </option>
          <option value="local-whisper">
            Local Whisper CLI (100% Free Offline — mlx_whisper / whisper.cpp)
          </option>
          <option value="web-speech">
            Browser Web Speech API (Free Built-in)
          </option>
        </select>
      </SettingsRow>

      {(engine === "auto" || engine === "groq-whisper") && (
        <>
          <SettingsRow
            title="Groq Whisper Model"
            description="Free-tier Whisper models hosted on Groq Cloud with ultra-low latency."
          >
            <select
              className={styles["settings-select"]}
              value={whisperModel}
              onChange={(e) => setWhisperModel(e.target.value)}
              data-testid="ai-transcription-model-select"
            >
              {GROQ_WHISPER_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </SettingsRow>

          <SettingsRow
            title="Groq API Key (Free Tier)"
            description="Get a free API key at console.groq.com. Stored securely in your OS keychain."
          >
            <div className={styles["api-key-input-group"]}>
              <input
                type={showKey ? "text" : "password"}
                className={styles["api-key-input"]}
                placeholder="gsk_... (Free Groq API Key)"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                data-testid="groq-whisper-key-input"
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
        </>
      )}

      {toolsStatus && (
        <div
          className={styles["privacy-warning-banner"]}
          data-testid="transcription-tools-status"
        >
          <Broadcast size={16} />
          <Typography variant="text" size="xs">
            Ready free tools:{" "}
            {toolsStatus.groqConfigured || groqApiKey.trim()
              ? "✓ Groq Whisper API "
              : ""}
            {toolsStatus.localWhisperInstalled
              ? `✓ Local Whisper (${toolsStatus.localWhisperBinary}) `
              : ""}
            ✓ Browser Web Speech
          </Typography>
        </div>
      )}

      <div className={styles["settings-card-actions"]}>
        <button
          type="button"
          className={`${styles["btn"]} ${styles["btn--primary"]}`}
          onClick={() => void handleSaveTranscription()}
          data-testid="ai-transcription-save-btn"
        >
          {savedSuccess ? (
            <>
              <Check size={14} weight="bold" />
              <span>Transcript Settings Saved</span>
            </>
          ) : (
            <span>Save Transcript Settings</span>
          )}
        </button>
      </div>
    </SettingsCard>
  );
}
