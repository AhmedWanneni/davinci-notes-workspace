import { useState, useRef, useEffect, useMemo } from "react";
import { CaretDown, Check, Gear, Cpu, Terminal } from "@phosphor-icons/react";
import { fetchOllamaModels, type AIProviderId } from "../../ai/AISubsystem";
import { detectCliAgents } from "./cliAgentBridge";
import {
  CLI_AGENT_CATALOG,
  type CliAgentInfo,
  type CliAgentId,
} from "./cliAgentTypes";

export interface AgentModelOption {
  id: string;
  label: string;
  providerId: AIProviderId;
}

export const BASE_POPULAR_MODELS: AgentModelOption[] = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", providerId: "gemini" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", providerId: "gemini" },
  {
    id: "openai/gpt-4o-mini",
    label: "OpenRouter: GPT-4o Mini",
    providerId: "openrouter",
  },
  {
    id: "anthropic/claude-3.5-haiku",
    label: "OpenRouter: Claude 3.5 Haiku",
    providerId: "openrouter",
  },
];

export interface AgentModelSelectProps {
  currentModel: string;
  currentProvider: AIProviderId;
  onSelectModel: (model: string, provider: AIProviderId) => void;
  selectedCliAgent?: string | null;
  onSelectCliAgent?: (agentId: string | null) => void;
  onOpenSettings: () => void;
  disabled?: boolean;
}

export function AgentModelSelect({
  currentModel,
  currentProvider,
  onSelectModel,
  selectedCliAgent,
  onSelectCliAgent,
  onOpenSettings,
  disabled,
}: AgentModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"model" | "agent">(
    selectedCliAgent ? "agent" : "model",
  );
  const [installedOllamaModels, setInstalledOllamaModels] = useState<string[]>(
    [],
  );
  const [cliAgents, setCliAgents] = useState<CliAgentInfo[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCliAgent) setActiveTab("agent");
  }, [selectedCliAgent]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchOllamaModels().then((models) => {
      if (models.length > 0) setInstalledOllamaModels(models);
    });
    void detectCliAgents().then((agents) => {
      if (agents.length > 0) setCliAgents(agents);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const modelOptions = useMemo(() => {
    const ollamaOpts: AgentModelOption[] =
      installedOllamaModels.length > 0
        ? installedOllamaModels.map((m) => ({
            id: m,
            label: `Ollama: ${m} (Local)`,
            providerId: "ollama",
          }))
        : [
            {
              id: "gemma3",
              label: "Ollama: gemma3 (Local)",
              providerId: "ollama",
            },
            {
              id: "llama3",
              label: "Ollama: llama3 (Local)",
              providerId: "ollama",
            },
          ];
    return [
      BASE_POPULAR_MODELS[0],
      BASE_POPULAR_MODELS[1],
      ...ollamaOpts,
      BASE_POPULAR_MODELS[2],
      BASE_POPULAR_MODELS[3],
    ];
  }, [installedOllamaModels]);

  const activeOption = modelOptions.find(
    (m) =>
      m.id === currentModel ||
      (m.providerId === currentProvider &&
        (m.id === currentModel ||
          m.id.startsWith(currentModel) ||
          currentModel.startsWith(m.id))),
  );
  const modelDisplayLabel = activeOption
    ? activeOption.label
    : currentModel
      ? `${currentProvider === "ollama" ? "Ollama: " : ""}${currentModel}`
      : "Model";

  const activeAgentMeta = selectedCliAgent
    ? CLI_AGENT_CATALOG[selectedCliAgent as CliAgentId]
    : null;
  const triggerLabel = selectedCliAgent
    ? `Agent: ${activeAgentMeta?.name || selectedCliAgent}`
    : `Model: ${modelDisplayLabel}`;

  return (
    <div className="agent-model-select" ref={containerRef}>
      <button
        type="button"
        className="agent-model-select__trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedCliAgent ? (
          <Terminal size={12} weight="bold" />
        ) : (
          <Cpu size={12} weight="bold" />
        )}
        <span className="agent-model-select__label">{triggerLabel}</span>
        <CaretDown
          size={12}
          weight="bold"
          className="agent-model-select__caret"
        />
      </button>

      {isOpen && (
        <div className="agent-model-select__menu" role="listbox">
          <div className="agent-model-select__tabs">
            <button
              type="button"
              className={`agent-model-select__tab${activeTab === "model" ? " is-active" : ""}`}
              onClick={() => setActiveTab("model")}
            >
              <Cpu size={12} /> Model
            </button>
            <button
              type="button"
              className={`agent-model-select__tab${activeTab === "agent" ? " is-active" : ""}`}
              onClick={() => setActiveTab("agent")}
            >
              <Terminal size={12} /> Agent
            </button>
          </div>

          <div className="agent-model-select__options">
            {activeTab === "model"
              ? modelOptions.map((opt) => {
                  const isSelected =
                    !selectedCliAgent &&
                    (opt.id === currentModel ||
                      opt.label === modelDisplayLabel);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`agent-model-select__item${isSelected ? " agent-model-select__item--selected" : ""}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSelectCliAgent?.(null);
                        onSelectModel(opt.id, opt.providerId);
                        setIsOpen(false);
                      }}
                    >
                      <span className="agent-model-select__item-label">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check
                          size={14}
                          weight="bold"
                          className="agent-model-select__check"
                        />
                      )}
                    </button>
                  );
                })
              : cliAgents.map((agent) => {
                  const isSelected = selectedCliAgent === agent.id;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      className={`agent-model-select__item${isSelected ? " agent-model-select__item--selected" : ""}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        if (agent.installed) {
                          onSelectCliAgent?.(agent.id);
                          setIsOpen(false);
                        }
                      }}
                      style={{ opacity: agent.installed ? 1 : 0.6 }}
                    >
                      <span className="agent-model-select__item-label">
                        {agent.name} {agent.installed ? "✓" : "(Not installed)"}
                      </span>
                      {isSelected && (
                        <Check
                          size={14}
                          weight="bold"
                          className="agent-model-select__check"
                        />
                      )}
                    </button>
                  );
                })}
          </div>

          <div className="agent-model-select__footer">
            <button
              type="button"
              className="agent-model-select__settings-btn"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
            >
              <Gear size={13} />
              <span>Configure AI & Agent Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
