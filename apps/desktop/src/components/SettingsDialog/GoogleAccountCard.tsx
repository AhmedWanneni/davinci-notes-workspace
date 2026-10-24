import React from "react";
import { Button } from "@app/design-system";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import localStyles from "./GoogleCalendarSettingsTab.module.scss";

export interface GoogleAccountCardProps {
  isConnected: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  clientId: string;
  errorMessage: string | null;
  onClientIdChange: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function GoogleAccountCard({
  isConnected,
  isConnecting,
  isLoading,
  clientId,
  errorMessage,
  onClientIdChange,
  onConnect,
  onDisconnect,
}: GoogleAccountCardProps) {
  return (
    <SettingsCard title="Google Account">
      {errorMessage && (
        <div
          className={localStyles["settings-error-banner"]}
          role="alert"
          data-testid="calendar-settings-error"
        >
          <span>{errorMessage}</span>
        </div>
      )}

      {!isConnected && (
        <SettingsRow
          title="OAuth Client ID"
          description="Desktop Client ID from Google Cloud Console. Can also be set via VITE_GOOGLE_CLIENT_ID."
        >
          <input
            type="text"
            value={clientId}
            onChange={(e) => onClientIdChange(e.target.value)}
            placeholder="123456789-xxx.apps.googleusercontent.com"
            className={localStyles["settings-input-wide"]}
            aria-label="Google OAuth Client ID"
            data-testid="calendar-client-id-input"
          />
        </SettingsRow>
      )}

      <SettingsRow
        title={isConnected ? "Connected to Google" : "Not Connected"}
        description={
          isConnected
            ? "Your Google Calendar is linked with read-only permissions."
            : "Sign in with Google to view events and join meetings."
        }
      >
        {isConnected ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onDisconnect}
            data-testid="disconnect-calendar-btn"
          >
            Disconnect
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={onConnect}
            disabled={isConnecting || isLoading}
            data-testid="connect-calendar-btn"
          >
            {isConnecting ? "Connecting..." : "Connect Google Calendar"}
          </Button>
        )}
      </SettingsRow>
    </SettingsCard>
  );
}
