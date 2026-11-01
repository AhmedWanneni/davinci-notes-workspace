import { useState } from "react";
import {
  Image as ImageIcon,
  PencilSimpleLine,
  Globe,
} from "@phosphor-icons/react";
import { AgentPromptBar } from "./AgentPromptBar";
import type { AgentShortcut } from "@app/ai-agent";
import styles from "./AgentWelcomeView.module.scss";

export interface AgentWelcomeViewProps {
  userName?: string;
  onSend: (prompt: string) => void;
  shortcuts?: AgentShortcut[];
  isStreaming?: boolean;
}

const QUICK_ACTIONS = [
  {
    id: "image",
    icon: ImageIcon,
    label: "Create an image or sticker",
    prompt: "Create an image of ",
  },
  {
    id: "write",
    icon: PencilSimpleLine,
    label: "Write or edit",
    prompt: "Help me write or edit ",
  },
  {
    id: "search",
    icon: Globe,
    label: "Search the web",
    prompt: "Search the web for ",
  },
];

export function AgentWelcomeView({
  userName = "Ahmed",
  onSend,
  shortcuts = [],
  isStreaming = false,
}: AgentWelcomeViewProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (!prompt.trim() || isStreaming) return;
    onSend(prompt.trim());
    setPrompt("");
  };

  const handleSelectQuickAction = (template: string) => {
    setPrompt(template);
  };

  return (
    <div
      className={styles["welcome-view"]}
      role="region"
      aria-label="AI Welcome"
    >
      <div className={styles["welcome-view__container"]}>
        <h1 className={styles["welcome-view__greeting"]}>
          Good to see you, {userName}.
        </h1>

        <div className={styles["welcome-view__prompt-wrap"]}>
          <AgentPromptBar
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleSubmit}
            onSendWithImages={(text) => {
              onSend(text);
              setPrompt("");
            }}
            placeholder="Write a message..."
            shortcuts={shortcuts}
            isStreaming={isStreaming}
            autoFocus
          />
        </div>

        <div className={styles["welcome-view__suggestions"]}>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                className={styles["welcome-view__suggestion-item"]}
                onClick={() => handleSelectQuickAction(action.prompt)}
              >
                <Icon
                  size={18}
                  weight="regular"
                  className={styles["welcome-view__suggestion-icon"]}
                />
                <span className={styles["welcome-view__suggestion-text"]}>
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
