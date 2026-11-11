import React, { useState, useRef, useEffect } from "react";
import { Cpu, Terminal, CaretDown, Check } from "@phosphor-icons/react";
import { useAgentStore } from "../AgentView/useAgentStore";
import { detectCliAgents } from "../AgentView/cliAgentBridge";
import {
  CLI_AGENT_CATALOG,
  type CliAgentInfo,
} from "../AgentView/cliAgentTypes";
import { fetchOllamaModels } from "../../ai/AISubsystem";
import styles from "./RecordAgentPicker.module.scss";

const RECORD_PRESET_MODELS = [
  { id: "gemini-2.0-flash", label: "Sophia · Gemini 2.0 Flash", provider: "gemini" },
  { id: "gemini-1.5-pro", label: "Sophia · Gemini 1.5 Pro", provider: "gemini" },
  { id: "llama-3.3-70b-versatile", label: "Sophia · Groq Llama 3.3 70B (Free)", provider: "groq" },
  { id: "openai/gpt-4o-mini", label: "Sophia · GPT-4o Mini", provider: "openrouter" },
  {
    id: "anthropic/claude-3.5-haiku",
    label: "Sophia · Claude 3.5 Haiku",
    provider: "openrouter",
  },
];

export function RecordAgentPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [cliAgents, setCliAgents] = useState<CliAgentInfo[]>([]);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedModel = useAgentStore((s) => s.selectedModel);
  const selectedCliAgent = useAgentStore((s) => s.selectedCliAgent);
  const cliAgentModels = useAgentStore((s) => s.cliAgentModels);
  const setSelectedModel = useAgentStore((s) => s.setSelectedModel);
  const setSelectedCliAgent = useAgentStore((s) => s.setSelectedCliAgent);
  const setCliAgentModel = useAgentStore((s) => s.setCliAgentModel);

  useEffect(() => {
    if (!isOpen) return;
    void detectCliAgents().then((list) => {
      if (list.length > 0) setCliAgents(list);
    });
    void fetchOllamaModels().then((models) => {
      if (models.length > 0) setOllamaModels(models);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  const currentCliMeta = selectedCliAgent
    ? CLI_AGENT_CATALOG[selectedCliAgent as keyof typeof CLI_AGENT_CATALOG]
    : null;
  const currentCliModel = selectedCliAgent
    ? cliAgentModels[selectedCliAgent] || currentCliMeta?.defaultModel
    : null;
  const currentCliModelLabel = currentCliMeta?.models.find(
    (m) => m.id === currentCliModel,
  )?.label;

  const activeLabel = selectedCliAgent
    ? `${currentCliMeta?.name.split(" ")[0] || selectedCliAgent}${
        currentCliModelLabel ? ` · ${currentCliModelLabel}` : ""
      }`
    : RECORD_PRESET_MODELS.find((m) => m.id === selectedModel)?.label ||
      `Sophia · ${selectedModel}`;

  return (
    <div className={styles["agent-picker"]} ref={menuRef} data-testid="record-agent-picker">
      <button
        type="button"
        className={styles["agent-picker__trigger"]}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Select AI Agent from AI Agent Page"
        aria-label="Select AI Agent"
        data-testid="record-agent-picker-trigger"
      >
        {selectedCliAgent ? <Terminal size={13} /> : <Cpu size={13} />}
        <span className={styles["agent-picker__trigger-label"]}>
          {activeLabel}
        </span>
        <CaretDown size={11} weight="bold" />
      </button>

      {isOpen && (
        <div
          className={styles["agent-picker__menu"]}
          role="menu"
          data-testid="record-agent-picker-menu"
        >
          <div className={styles["agent-picker__section-header"]}>
            AI Agents (Synced with AI Agent Page)
          </div>

          <button
            type="button"
            className={`${styles["agent-picker__item"]} ${
              !selectedCliAgent ? styles["is-active"] : ""
            }`}
            onClick={() => {
              setSelectedCliAgent(null);
              setIsOpen(false);
            }}
            data-testid="record-agent-option-sophia"
          >
            <Cpu size={16} />
            <span className={styles["agent-picker__item-label"]}>
              Sophia Assistant (Built-in)
            </span>
            {!selectedCliAgent && <Check size={13} weight="bold" />}
          </button>

          {Object.entries(CLI_AGENT_CATALOG).map(([agentId, agent]) => {
            const isSelected = selectedCliAgent === agentId;
            const isInstalled = cliAgents.some(
              (a) => a.id === agentId && a.installed,
            );
            const activeSubModel =
              cliAgentModels[agentId] || agent.defaultModel;

            return (
              <div key={agentId}>
                <button
                  type="button"
                  className={`${styles["agent-picker__item"]} ${
                    isSelected ? styles["is-active"] : ""
                  }`}
                  onClick={() => {
                    setSelectedCliAgent(agentId);
                    if (!cliAgentModels[agentId]) {
                      setCliAgentModel(agentId, agent.defaultModel);
                    }
                    setIsOpen(false);
                  }}
                  data-testid={`record-agent-option-${agentId}`}
                >
                  <Terminal size={16} />
                  <span className={styles["agent-picker__item-label"]}>
                    {agent.name}
                  </span>
                  <span className={styles["agent-picker__item-meta"]}>
                    {isInstalled ? "Installed" : "CLI"}
                  </span>
                  {isSelected && <Check size={13} weight="bold" />}
                </button>

                {isSelected && agent.models.length > 0 && (
                  <div className={styles["agent-picker__submodels"]}>
                    {agent.models.map((mod) => (
                      <button
                        key={mod.id}
                        type="button"
                        className={`${styles["agent-picker__submodel-btn"]} ${
                          activeSubModel === mod.id ? styles["is-active"] : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCliAgentModel(agentId, mod.id);
                          setIsOpen(false);
                        }}
                      >
                        {mod.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className={styles["agent-picker__divider"]} />
          <div className={styles["agent-picker__section-header"]}>
            Sophia Assistant Models
          </div>

          {RECORD_PRESET_MODELS.map((m) => {
            const isSelected = !selectedCliAgent && selectedModel === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`${styles["agent-picker__item"]} ${
                  isSelected ? styles["is-active"] : ""
                }`}
                onClick={() => {
                  setSelectedModel(m.id, m.provider);
                  setIsOpen(false);
                }}
                data-testid={`record-model-option-${m.id}`}
              >
                <Cpu size={16} />
                <span className={styles["agent-picker__item-label"]}>
                  {m.label}
                </span>
                {isSelected && <Check size={13} weight="bold" />}
              </button>
            );
          })}

          {ollamaModels.length > 0 && (
            <>
              <div className={styles["agent-picker__divider"]} />
              <div className={styles["agent-picker__section-header"]}>
                Local Ollama Models (Free)
              </div>
              {ollamaModels.map((m) => {
                const isSelected = !selectedCliAgent && selectedModel === m;
                return (
                  <button
                    key={m}
                    type="button"
                    className={`${styles["agent-picker__item"]} ${
                      isSelected ? styles["is-active"] : ""
                    }`}
                    onClick={() => {
                      setSelectedModel(m, "ollama");
                      setIsOpen(false);
                    }}
                  >
                    <Cpu size={16} />
                    <span className={styles["agent-picker__item-label"]}>
                      Ollama: {m}
                    </span>
                    {isSelected && <Check size={13} weight="bold" />}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
export default RecordAgentPicker;
