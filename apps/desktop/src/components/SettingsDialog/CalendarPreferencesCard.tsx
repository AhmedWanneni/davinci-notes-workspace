import React from "react";
import { Toggle } from "@app/design-system";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import localStyles from "./GoogleCalendarSettingsTab.module.scss";

export interface CalendarPreferencesCardProps {
  refreshInterval: string;
  meetingsFolder: string;
  showDeclined: boolean;
  onIntervalChange: (val: string) => void;
  onMeetingsFolderChange: (val: string) => void;
  onToggleDeclined: (val: boolean) => void;
}

export function CalendarPreferencesCard({
  refreshInterval,
  meetingsFolder,
  showDeclined,
  onIntervalChange,
  onMeetingsFolderChange,
  onToggleDeclined,
}: CalendarPreferencesCardProps) {
  return (
    <SettingsCard title="Preferences">
      <SettingsRow
        title="Refresh Cadence"
        description="How often events sync in the background."
      >
        <select
          value={refreshInterval}
          onChange={(e) => onIntervalChange(e.target.value)}
          className={localStyles["settings-select"]}
          aria-label="Refresh Cadence"
        >
          <option value="5m">Every 5 minutes</option>
          <option value="15m">Every 15 minutes</option>
          <option value="30m">Every 30 minutes</option>
          <option value="manual">Manual only</option>
        </select>
      </SettingsRow>

      <SettingsRow
        title="Meeting Notes Folder"
        description="Vault folder where new meeting notes are created."
      >
        <input
          type="text"
          value={meetingsFolder}
          onChange={(e) => onMeetingsFolderChange(e.target.value)}
          className={localStyles["settings-input"]}
          placeholder="Meetings"
          aria-label="Meeting Notes Folder"
        />
      </SettingsRow>

      <SettingsRow
        title="Show Declined Events"
        description="Display calendar events you declined."
      >
        <Toggle
          checked={showDeclined}
          onCheckedChange={onToggleDeclined}
          aria-label="Show Declined Events"
        />
      </SettingsRow>
    </SettingsCard>
  );
}
