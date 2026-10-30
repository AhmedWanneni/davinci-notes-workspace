import React from "react";
import { Badge, Button, Toggle, Typography } from "@app/design-system";
import { Bell, PaperPlaneTilt, Trash } from "@phosphor-icons/react";
import type { ChannelDestinationMeta } from "../../notifications";
import styles from "./NotificationsSettingsTab.module.scss";

export interface NotificationDestinationRowProps {
  destination: ChannelDestinationMeta;
  feedback?: { ok: boolean; text: string };
  isTesting: boolean;
  onToggleDefault: (dest: ChannelDestinationMeta, isDefault: boolean) => void;
  onSendTest: (dest: ChannelDestinationMeta) => void;
  onRemove: (id: string) => void;
}

export function NotificationDestinationRow({
  destination,
  feedback,
  isTesting,
  onToggleDefault,
  onSendTest,
  onRemove,
}: NotificationDestinationRowProps) {
  const badgeVariant =
    destination.status === "connected"
      ? "success"
      : destination.status === "error"
        ? "error"
        : "neutral";

  return (
    <div
      className={styles["destination-row"]}
      role="listitem"
      data-testid={`channel-row-${destination.id}`}
    >
      <div className={styles["destination-main"]}>
        <div className={styles["destination-title-row"]}>
          <Bell size={15} />
          <span className={styles["destination-name"]}>{destination.name}</span>
          <Badge variant={badgeVariant}>{destination.status}</Badge>
          <Badge variant="neutral">{destination.kind}</Badge>
          {destination.kind === "whatsapp-callmebot" && (
            <Badge variant="warning">Experimental · Third-Party</Badge>
          )}
        </div>
        {destination.recipientHint && (
          <Typography variant="text" size="xs" color="muted">
            {destination.recipientHint}
          </Typography>
        )}
        {destination.lastError && (
          <div className={styles["destination-error"]} role="alert">
            {destination.lastError}
          </div>
        )}
        {feedback && (
          <div
            className={
              feedback.ok
                ? styles["feedback-success"]
                : styles["destination-error"]
            }
          >
            {feedback.text}
          </div>
        )}
      </div>

      <div className={styles["destination-actions"]}>
        <label className={styles["default-toggle"]}>
          <span>Default</span>
          <Toggle
            checked={destination.isDefaultForReminders}
            onCheckedChange={(v) => onToggleDefault(destination, v)}
            aria-label={`Default for ${destination.name}`}
          />
        </label>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSendTest(destination)}
          disabled={isTesting}
        >
          <PaperPlaneTilt size={13} />
          <span>{isTesting ? "Sending..." : "Send test message"}</span>
        </Button>
        {destination.kind !== "desktop" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(destination.id)}
            aria-label={`Remove ${destination.name}`}
          >
            <Trash size={14} />
            <span>Remove</span>
          </Button>
        )}
      </div>
    </div>
  );
}
