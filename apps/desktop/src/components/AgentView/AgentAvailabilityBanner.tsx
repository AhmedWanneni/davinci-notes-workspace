import { useState, useEffect, useCallback } from "react";
import { WarningCircle, Check } from "@phosphor-icons/react";
import {
  type AIProviderId,
  AI_PROVIDER_NAMES,
  loadAIProviderStatus,
  hasStoredProviderCredential,
} from "../../ai/AISubsystem";
import { detectCliAgents } from "./cliAgentBridge";
import { CLI_AGENT_CATALOG, type CliAgentId } from "./cliAgentTypes";
import { useAgentStore } from "./useAgentStore";
import styles from "./AgentAvailabilityBanner.module.scss";

export interface AgentAvailabilityBannerProps {
  providerId: AIProviderId;
  selectedCliAgent: string | null;
  onOpenSettings?: () => void;
}

export function AgentAvailabilityBanner({
  providerId,
  selectedCliAgent,
  onOpenSettings,
}: AgentAvailabilityBannerProps) {
  const setSelectedCliAgent = useAgentStore((s) => s.setSelectedCliAgent);
  const [copied, setCopied] = useState(false);
  const [cliInstalled, setCliInstalled] = useState<boolean | null>(null);
  const [providerConfigured, setProviderConfigured] = useState<boolean | null>(
    null,
  );

  const checkStatus = useCallback(async () => {
    if (selectedCliAgent) {
      try {
        const detected = await detectCliAgents();
        const info = detected.find((a) => a.id === selectedCliAgent);
        setCliInstalled(Boolean(info?.installed));
      } catch {
        setCliInstalled(false);
      }
      setProviderConfigured(true);
    } else {
      setCliInstalled(true);
      try {
        if (providerId === "ollama") {
          const status = await loadAIProviderStatus("ollama");
          setProviderConfigured(status !== "failed");
        } else {
          const hasKey = await hasStoredProviderCredential(providerId);
          const status = await loadAIProviderStatus(providerId);
          setProviderConfigured(hasKey && status !== "failed");
        }
      } catch {
        setProviderConfigured(false);
      }
    }
  }, [providerId, selectedCliAgent]);

  useEffect(() => {
    void checkStatus();
    const onAiStateChanged = () => void checkStatus();
    window.addEventListener("davinci-ai-state-changed", onAiStateChanged);
    return () =>
      window.removeEventListener("davinci-ai-state-changed", onAiStateChanged);
  }, [checkStatus]);

  if (selectedCliAgent && cliInstalled === false) {
    const meta = CLI_AGENT_CATALOG[selectedCliAgent as CliAgentId];
    const name = meta?.name || selectedCliAgent;
    const installCmd = meta?.installCommand || `npm install -g ${selectedCliAgent}`;

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(installCmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard failure ignored
      }
    };

    return (
      <aside className={styles["banner"]} role="alert" aria-label="CLI Agent unavailable">
        <div className={styles["banner__content"]}>
          <WarningCircle size={15} weight="fill" className={styles["banner__icon"]} />
          <span className={styles["banner__text"]}>
            <span className={styles["banner__strong"]}>{name}</span> is not installed or not found in PATH.
          </span>
        </div>
        <div className={styles["banner__actions"]}>
          <button
            type="button"
            className={styles["banner__action-btn"]}
            onClick={() => void handleCopy()}
            title={`Copy: ${installCmd}`}
          >
            {copied ? <Check size={11} /> : null}
            {copied ? "Copied" : "Copy Install Command"}
          </button>
          <button
            type="button"
            className={styles["banner__action-link"]}
            onClick={() => setSelectedCliAgent(null)}
          >
            Use Sophia Assistant
          </button>
        </div>
      </aside>
    );
  }

  if (!selectedCliAgent && providerConfigured === false) {
    const providerName = AI_PROVIDER_NAMES[providerId] || providerId;

    return (
      <aside className={styles["banner"]} role="alert" aria-label="AI Provider unavailable">
        <div className={styles["banner__content"]}>
          <WarningCircle size={15} weight="fill" className={styles["banner__icon"]} />
          <span className={styles["banner__text"]}>
            <span className={styles["banner__strong"]}>{providerName}</span> is not configured or offline.
          </span>
        </div>
        {onOpenSettings && (
          <div className={styles["banner__actions"]}>
            <button
              type="button"
              className={styles["banner__action-btn"]}
              onClick={onOpenSettings}
            >
              Configure in Settings
            </button>
          </div>
        )}
      </aside>
    );
  }

  return null;
}
