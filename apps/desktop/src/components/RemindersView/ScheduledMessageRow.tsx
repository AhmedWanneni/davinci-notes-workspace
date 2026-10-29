import React from "react";
import {
  Clock, PaperPlaneRight, X, ArrowClockwise,
  WhatsappLogo, TelegramLogo, SlackLogo, Phone, Desktop, Warning, Check,
} from "@phosphor-icons/react";
import type { ScheduledMessageRecord, ScheduledMessageStatus } from "../../reminders/scheduledMessagesStore";
import { openWhatsAppClickToChat } from "../../notifications/adapters/whatsappClickAdapter";
import styles from "./RemindersView.module.scss";
import scheduledStyles from "./ScheduledMessages.module.scss";

export interface ScheduledMessageRowProps {
  item: ScheduledMessageRecord;
  onSendNow: (item: ScheduledMessageRecord) => void;
  onCancel: (id: string) => void;
  onEdit: (item: ScheduledMessageRecord) => void;
}

function renderChannelIcon(channel: string) {
  switch (channel) {
    case "telegram":
      return <TelegramLogo size={14} />;
    case "slack":
      return <SlackLogo size={14} />;
    case "whatsapp":
      return <WhatsappLogo size={14} />;
    case "callmebot":
      return <Phone size={14} />;
    default:
      return <Desktop size={14} />;
  }
}

function renderStatusBadge(status: ScheduledMessageStatus) {
  switch (status) {
    case "scheduled":
      return (
        <span className={`${scheduledStyles["status-badge"]} ${scheduledStyles["status-badge--scheduled"]}`}>
          <Clock size={12} />
          <span>Scheduled</span>
        </span>
      );
    case "needs_manual_send":
      return (
        <span className={`${scheduledStyles["status-badge"]} ${scheduledStyles["status-badge--manual"]}`}>
          <WhatsappLogo size={12} />
          <span>Needs Manual Send</span>
        </span>
      );
    case "missed":
      return (
        <span className={`${scheduledStyles["status-badge"]} ${scheduledStyles["status-badge--missed"]}`}>
          <Warning size={12} />
          <span>Missed</span>
        </span>
      );
    case "sent":
      return (
        <span className={`${scheduledStyles["status-badge"]} ${scheduledStyles["status-badge--sent"]}`}>
          <Check size={12} />
          <span>Sent</span>
        </span>
      );
    case "failed":
      return (
        <span className={`${scheduledStyles["status-badge"]} ${scheduledStyles["status-badge--failed"]}`}>
          <Warning size={12} />
          <span>Failed</span>
        </span>
      );
    default:
      return null;
  }
}

export function ScheduledMessageRow({
  item,
  onSendNow,
  onCancel,
  onEdit: _onEdit,
}: ScheduledMessageRowProps) {
  const isPending = item.status === "scheduled" || item.status === "needs_manual_send" || item.status === "missed";
  const dueDate = new Date(item.dueAtUtc).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const channel = item.channelKind;
  const recipient = item.recipientLabel;
  const message = item.messageText;
  const repeatRule = item.recurrenceRule;
  const errorMessage = item.lastError;

  const handleManualSend = async () => {
    if (channel === "whatsapp-click") {
      await openWhatsAppClickToChat(recipient, message);
    }
    onSendNow(item);
  };

  return (
    <div className={scheduledStyles["scheduled-row"]} data-testid="scheduled-row">
      <div className={scheduledStyles["scheduled-row__body"]}>
        <div className={scheduledStyles["scheduled-row__header"]}>
          <span className={scheduledStyles["scheduled-row__channel"]}>
            {renderChannelIcon(channel)}
            <span className={scheduledStyles["scheduled-row__recipient"]}>{recipient}</span>
          </span>
          {renderStatusBadge(item.status)}
          <span className={scheduledStyles["scheduled-row__time"]}>
            <Clock size={12} />
            <span>{dueDate}</span>
          </span>
          {repeatRule && (
            <span className={scheduledStyles["scheduled-row__repeat"]} title={`Repeats: ${repeatRule}`}>
              <ArrowClockwise size={12} />
              <span>{repeatRule}</span>
            </span>
          )}
        </div>

        <p className={scheduledStyles["scheduled-row__text"]}>{message}</p>
        {errorMessage && (
          <p className={scheduledStyles["scheduled-row__error"]}>Error: {errorMessage}</p>
        )}
      </div>

      <div className={scheduledStyles["scheduled-row__actions"]}>
        {item.status === "needs_manual_send" ? (
          <button
            type="button"
            className={styles["btn--primary"]}
            onClick={handleManualSend}
            title="Open WhatsApp link to send"
          >
            <WhatsappLogo size={14} />
            <span>Send on WhatsApp</span>
          </button>
        ) : isPending ? (
          <button
            type="button"
            className={styles["btn--secondary"]}
            onClick={() => onSendNow(item)}
            title="Send immediately"
          >
            <PaperPlaneRight size={14} />
            <span>Send Now</span>
          </button>
        ) : null}

        {isPending && (
          <button
            type="button"
            className={scheduledStyles["scheduled-row__cancel-btn"]}
            onClick={() => onCancel(item.id)}
            title="Cancel scheduled message"
            aria-label="Cancel"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
