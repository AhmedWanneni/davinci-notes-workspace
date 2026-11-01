export type CliAgentId = "agy" | "claude" | "codex" | "opencode";

export interface CliAgentInfo {
  id: CliAgentId;
  name: string;
  binary: string;
  installed: boolean;
  version?: string;
  description: string;
  installCommand: string;
}

export type CliStreamKind = "thought" | "action" | "text" | "error" | "done";

export interface CliAgentStreamEvent {
  session_id: string;
  kind: CliStreamKind;
  content: string;
}

export interface AgentModelOption {
  id: string;
  label: string;
}

export const CLI_AGENT_CATALOG: Record<
  CliAgentId,
  {
    name: string;
    binary: string;
    description: string;
    installCommand: string;
    models: AgentModelOption[];
    defaultModel: string;
  }
> = {
  agy: {
    name: "Antigravity CLI (agy)",
    binary: "agy",
    description: "DeepMind autonomous coding & reasoning agent",
    installCommand: "npm install -g @google/antigravity-cli",
    defaultModel: "gemini-2.0-flash",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
      { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
    ],
  },
  claude: {
    name: "Claude Code",
    binary: "claude",
    description: "Anthropic's autonomous terminal coding agent",
    installCommand: "npm install -g @anthropic-ai/claude-code",
    defaultModel: "claude-3-7-sonnet",
    models: [
      { id: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet" },
      { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku", label: "Claude 3.5 Haiku" },
      { id: "claude-3-opus", label: "Claude 3 Opus" },
    ],
  },
  codex: {
    name: "Codex CLI",
    binary: "codex",
    description: "OpenAI autonomous code generation & terminal agent",
    installCommand: "npm install -g @openai/codex",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "o3-mini", label: "o3-Mini" },
    ],
  },
  opencode: {
    name: "OpenCode",
    binary: "opencode",
    description: "Open-source autonomous local & cloud agent",
    installCommand: "npm install -g opencode-ai",
    defaultModel: "deepseek-coder",
    models: [
      { id: "deepseek-coder", label: "DeepSeek Coder V2" },
      { id: "qwen-2.5-coder", label: "Qwen 2.5 Coder 32B" },
      { id: "llama-3.3", label: "Llama 3.3 70B" },
    ],
  },
};
