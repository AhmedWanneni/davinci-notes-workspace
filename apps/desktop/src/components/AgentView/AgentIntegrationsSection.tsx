import { Globe, CalendarCheck, Sparkle } from "@phosphor-icons/react";
import { Typography } from "@app/design-system";

export interface AgentIntegrationsSectionProps {
  webSearchEnabled: boolean;
  onToggleWebSearch: (enabled: boolean) => void;
  autoApply: boolean;
  onToggleAutoApply: (enabled: boolean) => void;
}

export function AgentIntegrationsSection({
  webSearchEnabled,
  onToggleWebSearch,
  autoApply,
  onToggleAutoApply,
}: AgentIntegrationsSectionProps) {
  return (
    <section className="agent-settings-panel__section">
      <Typography variant="text" size="xs" weight="semibold" color="muted">
        INTEGRATIONS & CAPABILITIES
      </Typography>

      <div className="agent-settings-panel__toggle-row">
        <div className="agent-settings-panel__toggle-info">
          <Globe size={16} />
          <div>
            <div className="agent-settings-panel__toggle-title">Web Search</div>
            <div className="agent-settings-panel__toggle-desc">
              Allow agent to research queries online
            </div>
          </div>
        </div>
        <button
          type="button"
          className={`agent-settings-panel__switch${webSearchEnabled ? " is-on" : ""}`}
          onClick={() => onToggleWebSearch(!webSearchEnabled)}
          aria-label="Toggle web search"
        >
          <div className="agent-settings-panel__switch-knob" />
        </button>
      </div>

      <div className="agent-settings-panel__toggle-row">
        <div className="agent-settings-panel__toggle-info">
          <CalendarCheck size={16} />
          <div>
            <div className="agent-settings-panel__toggle-title">
              Google Calendar
            </div>
            <div className="agent-settings-panel__toggle-desc">
              Sync tasks and meeting notes
            </div>
          </div>
        </div>
        <Typography variant="text" size="xs" color="muted">
          Connected
        </Typography>
      </div>

      <div className="agent-settings-panel__toggle-row">
        <div className="agent-settings-panel__toggle-info">
          <Sparkle size={16} />
          <div>
            <div className="agent-settings-panel__toggle-title">
              Auto-apply Vault Changes
            </div>
            <div className="agent-settings-panel__toggle-desc">
              Directly write files instead of staging diffs
            </div>
          </div>
        </div>
        <button
          type="button"
          className={`agent-settings-panel__switch${autoApply ? " is-on" : ""}`}
          onClick={() => onToggleAutoApply(!autoApply)}
          aria-label="Toggle auto-apply"
        >
          <div className="agent-settings-panel__switch-knob" />
        </button>
      </div>
    </section>
  );
}
