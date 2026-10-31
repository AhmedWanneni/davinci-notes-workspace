import { useEffect, useState, useCallback } from "react";
import { Checkbox, Typography } from "@app/design-system";
import { SettingsRow } from "../SettingsDialog/SettingsRow";
import {
  loadAgentPreferences,
  saveAgentPreference,
} from "../AgentView/agentPreferences";
import { AgentCliSection } from "../AgentView/AgentCliSection";
import {
  getSetting,
  getVaultIndexDb,
  setSetting,
  withDbLock,
} from "../../vault";

export function AIAgentSettingsSection() {
  const [prefs, setPrefs] = useState({
    autoApply: true,
    webSearchEnabled: true,
    rewriteEnabled: true,
  });
  const [selectedCliAgent, setSelectedCliAgent] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const p = await loadAgentPreferences();
      setPrefs(p);
      const db = await getVaultIndexDb();
      const savedAgent = await withDbLock(() =>
        getSetting(db, "ai.agent.cliAgent"),
      );
      setSelectedCliAgent(
        savedAgent && savedAgent.trim() ? savedAgent.trim() : null,
      );
    } catch (err) {
      console.warn("[ai-settings] Failed to load agent settings:", err);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const handleState = () => void loadData();
    window.addEventListener("davinci-ai-state-changed", handleState);
    return () =>
      window.removeEventListener("davinci-ai-state-changed", handleState);
  }, [loadData]);

  const handleToggle = async (
    key: "autoApply" | "webSearchEnabled" | "rewriteEnabled",
    value: boolean,
  ) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    await saveAgentPreference(key, value);
    window.dispatchEvent(new Event("davinci-ai-state-changed"));
  };

  const handleSelectCliAgent = async (agentId: string | null) => {
    setSelectedCliAgent(agentId);
    try {
      const db = await getVaultIndexDb();
      await withDbLock(() =>
        setSetting(db, "ai.agent.cliAgent", agentId ?? ""),
      );
      window.dispatchEvent(new Event("davinci-ai-state-changed"));
    } catch (err) {
      console.warn("[ai-settings] Failed to save CLI agent setting:", err);
    }
  };

  return (
    <div
      style={{
        marginTop: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <div
        style={{
          borderTop:
            "var(--border-width-thin) solid var(--color-border-subtle)",
          paddingTop: "var(--space-3)",
        }}
      >
        <Typography variant="text" size="sm" weight="medium">
          Agent Capabilities & Automation
        </Typography>
      </div>

      <SettingsRow
        title="Auto-apply Changes"
        description="Allow the AI agent to directly create and edit notes in your vault when requested."
      >
        <Checkbox
          checked={prefs.autoApply}
          onCheckedChange={(checked) =>
            void handleToggle("autoApply", checked === true)
          }
          aria-label="Auto-apply changes"
        />
      </SettingsRow>

      <SettingsRow
        title="Web Search"
        description="Enable the AI assistant to perform live web searches for relevant context."
      >
        <Checkbox
          checked={prefs.webSearchEnabled}
          onCheckedChange={(checked) =>
            void handleToggle("webSearchEnabled", checked === true)
          }
          aria-label="Web search"
        />
      </SettingsRow>

      <SettingsRow
        title="Prompt Optimization"
        description="Automatically refine and enrich instructions sent to models and agents."
      >
        <Checkbox
          checked={prefs.rewriteEnabled}
          onCheckedChange={(checked) =>
            void handleToggle("rewriteEnabled", checked === true)
          }
          aria-label="Prompt optimization"
        />
      </SettingsRow>

      <div style={{ marginTop: "var(--space-2)" }}>
        <AgentCliSection
          selectedCliAgent={selectedCliAgent}
          onSelectCliAgent={(id) => void handleSelectCliAgent(id)}
        />
      </div>
    </div>
  );
}
