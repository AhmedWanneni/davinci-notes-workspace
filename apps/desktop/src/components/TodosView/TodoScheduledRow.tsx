import type { JSX } from "react";
import {
  ArrowClockwise,
  Check,
  Clock,
  Desktop,
  PaperPlaneRight,
  Phone,
  SlackLogo,
  TelegramLogo,
  Warning,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react";
import type {
  ScheduledMessageRecord,
  ScheduledMessageStatus,
} from "../../reminders/scheduledMessagesStore";
import { openWhatsAppClickToChat } from "../../notifications/adapters/whatsappClickAdapter";
import styles from "./TodoScheduledRow.module.scss";

export interface TodoScheduledRowProps {
  item: ScheduledMessageRecord;
  onSendNow: (item: ScheduledMessageRecord) => void;
  onCancel: (id: string) => void;
}

function renderChannelIcon(channel: string): JSX.Element {
  switch (channel) {
    case "telegram":
      return <TelegramLogo size={13} />;
    case "slack":
      return <SlackLogo size={13} />;
    case "whatsapp":
    case "whatsapp-click":
      return <WhatsappLogo size={13} />;
    case "callmebot":
      return <Phone size={13} />;
    default:
      return <Desktop size={13} />;
  }
}

function renderStatusBadge(status: ScheduledMessageStatus): JSX.Element | null {
  switch (status) {
    case "scheduled":
      return (
        <span className={`${styles["todo-scheduled-row__badge"]} ${styles["is-scheduled"]}`}>
          <Clock size={11} />
          <span>Scheduled</span>
        </span>
      );
    case "needs_manual_send":
      return (
        <span className={`${styles["todo-scheduled-row__badge"]} ${styles["is-manual"]}`}>
          <WhatsappLogo size={11} />
          <span>Needs Send</span>
        </span>
      );
    case "missed":
    case "failed":
      return (
        <span className={`${styles["todo-scheduled-row__badge"]} ${styles["is-missed"]}`}>
          <Warning size={11} />
          <span>{status === "missed" ? "Missed" : "Failed"}</span>
        </span>
      );
    case "sent":
      return (
        <span className={`${styles["todo-scheduled-row__badge"]} ${styles["is-sent"]}`}>
          <Check size={11} />
          <span>Sent</span>
        </span>
      );
    default:
      return null;
  }
}

export function TodoScheduledRow({
  item,
  onSendNow,
  onCancel,
}: TodoScheduledRowProps): JSX.Element {
  const isPending =
    item.status === "scheduled" ||
    item.status === "needs_manual_send" ||
    item.status === "missed";

  const dueDate = new Date(item.dueAtUtc).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const handleManualSend = async () => {
    if (item.channelKind === "whatsapp-click" || item.channelKind === "whatsapp-callmebot") {
      await openWhatsAppClickToChat(item.recipientLabel, item.messageText);
    }
    onSendNow(item);
  };

  return (
    <div
      className={`${styles["todo-scheduled-row"]} ${item.status === "sent" ? styles["is-sent"] : ""}`}
      data-testid={`todo-scheduled-row-${item.id}`}
    >
      <div className={styles["todo-scheduled-row__left"]}>
        <span className={styles["todo-scheduled-row__channel"]}>
          {renderChannelIcon(item.channelKind)}
          <span>{item.recipientLabel}</span>
        </span>

        {renderStatusBadge(item.status)}

        <span className={styles["todo-scheduled-row__badge"]}>
          <Clock size={11} />
          <span>{dueDate}</span>
        </span>

        {item.recurrenceRule && (
          <span className={styles["todo-scheduled-row__badge"]} title={`Repeats: ${item.recurrenceRule}`}>
            <ArrowClockwise size={11} />
            <span>{item.recurrenceRule}</span>
          </span>
        )}

        <span className={styles["todo-scheduled-row__text"]}>{item.messageText}</span>
      </div>

      <div className={styles["todo-scheduled-row__actions"]}>
        {item.status === "needs_manual_send" ? (
          <button
            type="button"
            className={`${styles["todo-scheduled-row__action-btn"]} ${styles["is-whatsapp"]}`}
            onClick={() => void handleManualSend()}
            title="Open WhatsApp to send"
          >
            <WhatsappLogo size={13} />
            <span>Send on WhatsApp</span>
          </button>
        ) : isPending ? (
          <button
            type="button"
            className={`${styles["todo-scheduled-row__action-btn"]} ${styles["is-primary"]}`}
            onClick={() => onSendNow(item)}
            title="Send immediately"
          >
            <PaperPlaneRight size={13} />
            <span>Send Now</span>
          </button>
        ) : null}

        {isPending && (
          <button
            type="button"
            className={styles["todo-scheduled-row__cancel-btn"]}
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
