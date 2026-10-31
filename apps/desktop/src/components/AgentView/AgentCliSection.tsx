import { useEffect, useState } from "react";
import { Terminal, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Typography } from "@app/design-system";
import { detectCliAgents } from "./cliAgentBridge";
import {
  CLI_AGENT_CATALOG,
  type CliAgentInfo,
  type CliAgentId,
} from "./cliAgentTypes";

export interface AgentCliSectionProps {
  selectedCliAgent?: string | null;
  onSelectCliAgent: (agentId: string | null) => void;
}

export function AgentCliSection({
  selectedCliAgent,
  onSelectCliAgent,
}: AgentCliSectionProps) {
  const [agents, setAgents] = useState<CliAgentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void detectCliAgents().then((detected) => {
      if (active) {
        setAgents(detected);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      className="agent-settings-panel__section"
      data-testid="agent-cli-section"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="text" size="xs" weight="semibold" color="muted">
          AUTONOMOUS CLI AGENTS
        </Typography>
        {selectedCliAgent && (
          <button
            type="button"
            className="agent-settings-panel__link"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-accent)",
              fontSize: "var(--font-size-xs)",
            }}
            onClick={() => onSelectCliAgent(null)}
          >
            Use API Model Instead
          </button>
        )}
      </div>

      <Typography
        variant="text"
        size="xs"
        color="muted"
        style={{ margin: "var(--space-1) 0 var(--space-2)" }}
      >
        Run autonomous agents directly in your vault for deep restructuring &
        roadmaps.
      </Typography>

      {isLoading ? (
        <Typography variant="text" size="xs" color="muted">
          Scanning system for CLI agents...
        </Typography>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          {agents.map((agent) => {
            const isSelected = selectedCliAgent === agent.id;
            const meta = CLI_AGENT_CATALOG[agent.id as CliAgentId];
            return (
              <div
                key={agent.id}
                onClick={() => {
                  if (agent.installed) {
                    onSelectCliAgent(isSelected ? null : agent.id);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-2) var(--space-3)",
                  border: `var(--border-width-thin) solid ${isSelected ? "var(--color-border-accent)" : "var(--color-border-subtle)"}`,
                  backgroundColor: isSelected
                    ? "var(--color-bg-tertiary)"
                    : "var(--color-bg-secondary)",
                  borderRadius: "var(--radius-sm)",
                  cursor: agent.installed ? "pointer" : "default",
                  opacity: agent.installed ? 1 : 0.65,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  <Terminal size={16} />
                  <div>
                    <div
                      style={{
                        fontSize: "var(--font-size-xs)",
                        fontWeight: "var(--font-weight-medium)",
                      }}
                    >
                      {agent.name}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--font-size-2xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {agent.installed
                        ? agent.version || "Installed on system"
                        : `Install: ${meta?.installCommand || agent.binary}`}
                    </div>
                  </div>
                </div>

                <div>
                  {agent.installed ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "var(--font-size-2xs)",
                        color: "var(--color-text-success)",
                      }}
                    >
                      <CheckCircle size={12} />{" "}
                      {isSelected ? "ACTIVE" : "READY"}
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "var(--font-size-2xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <WarningCircle size={12} /> NOT FOUND
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
