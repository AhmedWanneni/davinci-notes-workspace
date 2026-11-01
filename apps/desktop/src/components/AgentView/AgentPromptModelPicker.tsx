import { useState, useRef, useEffect } from "react";
import { Cpu, Terminal, CaretDown, Check } from "@phosphor-icons/react";
import { useAgentStore } from "./useAgentStore";
import { fetchOllamaModels } from "../../ai/AISubsystem";
import { detectCliAgents } from "./cliAgentBridge";
import { CLI_AGENT_CATALOG, type CliAgentInfo } from "./cliAgentTypes";
import styles from "./AgentPromptModelPicker.module.scss";

const PRESET_MODELS = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "gemini" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "gemini" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "openrouter" },
  {
    id: "anthropic/claude-3.5-haiku",
    label: "Claude 3.5 Haiku",
    provider: "openrouter",
  },
];

export function AgentPromptModelPicker() {
  const isOpen = useAgentStore((s) => s.isModelPickerOpen);
  const setIsOpen = useAgentStore((s) => s.setModelPickerOpen);
  const powerTier = useAgentStore((s) => s.powerTier);
  const setPowerTier = useAgentStore((s) => s.setPowerTier);
  const [tab, setTab] = useState<"models" | "agents">("models");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [cliAgents, setCliAgents] = useState<CliAgentInfo[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedModel = useAgentStore((s) => s.selectedModel);
  const selectedCliAgent = useAgentStore((s) => s.selectedCliAgent);
  const cliAgentModels = useAgentStore((s) => s.cliAgentModels);
  const setSelectedModel = useAgentStore((s) => s.setSelectedModel);
  const setSelectedCliAgent = useAgentStore((s) => s.setSelectedCliAgent);
  const setCliAgentModel = useAgentStore((s) => s.setCliAgentModel);

  useEffect(() => {
    if (!isOpen) return;
    void fetchOllamaModels().then((m) => {
      if (m.length > 0) setOllamaModels(m);
    });
    void detectCliAgents().then((a) => {
      if (a.length > 0) setCliAgents(a);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  const currentCliMeta = selectedCliAgent
    ? CLI_AGENT_CATALOG[selectedCliAgent as keyof typeof CLI_AGENT_CATALOG]
    : null;
  const currentCliModel = selectedCliAgent
    ? cliAgentModels[selectedCliAgent]
    : null;
  const currentCliModelLabel = currentCliMeta?.models.find(
    (m) => m.id === currentCliModel,
  )?.label;

  const tierCap = powerTier.charAt(0).toUpperCase() + powerTier.slice(1);
  const currentBase = selectedCliAgent
    ? `${currentCliMeta?.name.split(" ")[0] || selectedCliAgent}${currentCliModelLabel ? ` ${currentCliModelLabel}` : ""}`
    : PRESET_MODELS.find((m) => m.id === selectedModel)?.label || selectedModel;
  const currentLabel = `${currentBase} ${tierCap}`;

  return (
    <div className={styles["picker"]} ref={popoverRef}>
      <button
        type="button"
        className={styles["picker__btn"]}
        onClick={() => setIsOpen(!isOpen)}
        title="Select AI Model or Agent"
        aria-label="Select AI Model or Agent"
      >
        {selectedCliAgent ? (
          <Terminal size={14} weight="regular" />
        ) : (
          <Cpu size={14} weight="regular" />
        )}
        <span className={styles["picker__btn-text"]}>{currentLabel}</span>
        <CaretDown size={11} weight="bold" />
      </button>

      {isOpen && (
        <div className={styles["picker__popover"]} role="menu">
          <div className={styles["picker__power-section"]}>
            <div className={styles["picker__group-title"]}>Power</div>
            <div className={styles["picker__power-tabs"]}>
              {(["light", "medium", "high"] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  className={`${styles["picker__power-btn"]} ${powerTier === tier ? styles["is-active"] : ""}`}
                  onClick={() => setPowerTier(tier)}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles["picker__tabs"]}>
            <button
              type="button"
              className={`${styles["picker__tab"]} ${tab === "models" ? styles["is-active"] : ""}`}
              onClick={() => setTab("models")}
            >
              Models
            </button>
            <button
              type="button"
              className={`${styles["picker__tab"]} ${tab === "agents" ? styles["is-active"] : ""}`}
              onClick={() => setTab("agents")}
            >
              AI Agents
            </button>
          </div>

          <div className={styles["picker__list"]}>
            {tab === "models" ? (
              <>
                <div className={styles["picker__group-title"]}>
                  Cloud Models
                </div>
                {PRESET_MODELS.map((m) => {
                  const isSelected =
                    !selectedCliAgent && selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`${styles["picker__item"]} ${isSelected ? styles["is-active"] : ""}`}
                      onClick={() => {
                        setSelectedModel(m.id, m.provider);
                        setIsOpen(false);
                      }}
                    >
                      <Cpu size={14} />
                      <span className={styles["picker__item-label"]}>
                        {m.label}
                      </span>
                      {isSelected && (
                        <Check
                          size={13}
                          weight="bold"
                          className={styles["picker__check"]}
                        />
                      )}
                    </button>
                  );
                })}

                {ollamaModels.length > 0 && (
                  <>
                    <div className={styles["picker__group-title"]}>
                      Local (Ollama)
                    </div>
                    {ollamaModels.map((m) => {
                      const isSelected =
                        !selectedCliAgent && selectedModel === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          className={`${styles["picker__item"]} ${isSelected ? styles["is-active"] : ""}`}
                          onClick={() => {
                            setSelectedModel(m, "ollama");
                            setIsOpen(false);
                          }}
                        >
                          <Cpu size={14} />
                          <span className={styles["picker__item-label"]}>
                            Ollama: {m}
                          </span>
                          {isSelected && (
                            <Check
                              size={13}
                              weight="bold"
                              className={styles["picker__check"]}
                            />
                          )}
                        </button>
                      );
                    })}
                  </>
                )}
              </>
            ) : (
              <>
                <div className={styles["picker__group-title"]}>
                  Available Agents
                </div>
                <button
                  type="button"
                  className={`${styles["picker__item"]} ${!selectedCliAgent ? styles["is-active"] : ""}`}
                  onClick={() => {
                    setSelectedCliAgent(null);
                    setIsOpen(false);
                  }}
                >
                  <Cpu size={14} />
                  <span className={styles["picker__item-label"]}>
                    Sophia Assistant (Built-in)
                  </span>
                  {!selectedCliAgent && (
                    <Check
                      size={13}
                      weight="bold"
                      className={styles["picker__check"]}
                    />
                  )}
                </button>

                {Object.entries(CLI_AGENT_CATALOG).map(([agentId, agent]) => {
                  const isInstalled = cliAgents.some(
                    (a) => a.id === agentId && a.installed,
                  );
                  const isSelected = selectedCliAgent === agentId;
                  const activeModelId =
                    cliAgentModels[agentId] || agent.defaultModel;
                  return (
                    <div
                      key={agentId}
                      className={styles["picker__agent-block"]}
                    >
                      <button
                        type="button"
                        className={`${styles["picker__item"]} ${isSelected ? styles["is-active"] : ""}`}
                        onClick={() => {
                          setSelectedCliAgent(agentId);
                          if (!cliAgentModels[agentId]) {
                            setCliAgentModel(agentId, agent.defaultModel);
                          }
                        }}
                      >
                        <Terminal size={14} />
                        <div className={styles["picker__item-info"]}>
                          <span className={styles["picker__item-label"]}>
                            {agent.name}
                          </span>
                          <span className={styles["picker__item-desc"]}>
                            {agent.description}
                          </span>
                        </div>
                        {isInstalled && (
                          <span className={styles["picker__badge"]}>
                            Installed
                          </span>
                        )}
                        {isSelected && (
                          <Check
                            size={13}
                            weight="bold"
                            className={styles["picker__check"]}
                          />
                        )}
                      </button>
                      {isSelected &&
                        agent.models &&
                        agent.models.length > 0 && (
                          <div className={styles["picker__submodels"]}>
                            {agent.models.map((mod) => (
                              <button
                                key={mod.id}
                                type="button"
                                className={`${styles["picker__submodel-btn"]} ${activeModelId === mod.id ? styles["is-active"] : ""}`}
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
