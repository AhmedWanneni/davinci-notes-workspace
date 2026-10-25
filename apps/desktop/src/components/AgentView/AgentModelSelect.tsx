import { useState, useRef, useEffect } from "react";
import { CaretDown, Check, Gear } from "@phosphor-icons/react";
import type { AIProviderId } from "../../ai/AISubsystem";

export interface AgentModelOption {
  id: string;
  label: string;
  providerId: AIProviderId;
}

export const POPULAR_MODELS: AgentModelOption[] = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", providerId: "gemini" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", providerId: "gemini" },
  { id: "gemma3", label: "Ollama: gemma3 (Local)", providerId: "ollama" },
  { id: "llama3", label: "Ollama: llama3 (Local)", providerId: "ollama" },
  { id: "openai/gpt-4o-mini", label: "OpenRouter: GPT-4o Mini", providerId: "openrouter" },
  { id: "anthropic/claude-3.5-haiku", label: "OpenRouter: Claude 3.5 Haiku", providerId: "openrouter" },
];

export interface AgentModelSelectProps {
  currentModel: string;
  currentProvider: AIProviderId;
  onSelectModel: (model: string, provider: AIProviderId) => void;
  onOpenSettings: () => void;
  disabled?: boolean;
}

export function AgentModelSelect({
  currentModel,
  currentProvider,
  onSelectModel,
  onOpenSettings,
  disabled,
}: AgentModelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const activeOption = POPULAR_MODELS.find(
    (m) => m.id === currentModel || (m.providerId === currentProvider && m.id.includes(currentModel))
  );
  const displayLabel = activeOption ? activeOption.label : currentModel || "Model";

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
        <span className="agent-model-select__label">{displayLabel}</span>
        <CaretDown size={12} weight="bold" className="agent-model-select__caret" />
      </button>

      {isOpen && (
        <div className="agent-model-select__menu" role="listbox">
          <div className="agent-model-select__options">
            {POPULAR_MODELS.map((opt) => {
              const isSelected = opt.id === currentModel || opt.label === displayLabel;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`agent-model-select__item${isSelected ? " agent-model-select__item--selected" : ""}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectModel(opt.id, opt.providerId);
                    setIsOpen(false);
                  }}
                >
                  <span className="agent-model-select__item-label">{opt.label}</span>
                  {isSelected && <Check size={14} weight="bold" className="agent-model-select__check" />}
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
              <span>Configure AI & Keys</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
