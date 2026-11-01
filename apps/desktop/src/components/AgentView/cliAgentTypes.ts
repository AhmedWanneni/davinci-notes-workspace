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

export const CLI_AGENT_CATALOG: Record<
  CliAgentId,
  { name: string; binary: string; description: string; installCommand: string }
> = {
  agy: {
    name: "Antigravity CLI (agy)",
    binary: "agy",
    description: "DeepMind autonomous coding & reasoning agent",
    installCommand: "npm install -g @google/antigravity-cli",
  },
  claude: {
    name: "Claude Code",
    binary: "claude",
    description: "Anthropic's autonomous terminal coding agent",
    installCommand: "npm install -g @anthropic-ai/claude-code",
  },
  codex: {
    name: "Codex CLI",
    binary: "codex",
    description: "OpenAI autonomous code generation & terminal agent",
    installCommand: "npm install -g @openai/codex",
  },
  opencode: {
    name: "OpenCode",
    binary: "opencode",
    description: "Open-source autonomous local & cloud agent",
    installCommand: "npm install -g opencode-ai",
  },
};
