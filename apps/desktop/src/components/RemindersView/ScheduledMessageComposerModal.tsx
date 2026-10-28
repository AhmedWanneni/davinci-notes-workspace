import React, { useState } from "react";
import { X, CalendarBlank, Clock, Repeat, Warning } from "@phosphor-icons/react";
import type {
  CreateScheduledMessageInput,
  ScheduledChannelKind,
} from "../../reminders/scheduledMessagesStore";
import styles from "./RemindersView.module.scss";
import modalStyles from "./RemindersModal.module.scss";

export interface ScheduledMessageComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateScheduledMessageInput) => Promise<void>;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ScheduledMessageComposerModal({
  isOpen,
  onClose,
  onSave,
}: ScheduledMessageComposerModalProps) {
  const [channel, setChannel] = useState<ScheduledChannelKind>("telegram");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState("09:00");
  const [repeatRule, setRepeatRule] = useState("");
  const [allowChannelMentions, setAllowChannelMentions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) {
      setError("Recipient or destination is required.");
      return;
    }
    if (!message.trim()) {
      setError("Message text is required.");
      return;
    }
    const combinedDue = new Date(`${date}T${time || "00:00"}:00`);
    if (isNaN(combinedDue.getTime())) {
      setError("Invalid date or time.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        channelKind: channel,
        recipientLabel: recipient.trim(),
        messageText: message.trim(),
        dueAtUtc: combinedDue.toISOString(),
        recurrenceRule: repeatRule || null,
        allowMentions: channel === "slack" ? allowChannelMentions : false,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={modalStyles["modal-backdrop"]} onClick={onClose} role="dialog" aria-modal="true">
      <div className={modalStyles["modal-window"]} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles["modal-header"]}>
          <h2 className={modalStyles["modal-title"]}>Schedule Message</h2>
          <button
            type="button"
            className={modalStyles["modal-close-btn"]}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={modalStyles["modal-form"]}>
          {error && <div className={modalStyles["modal-error"]}>{error}</div>}

          <div className={modalStyles["form-field"]}>
            <label className={modalStyles["form-label"]}>Channel</label>
            <select
              className={modalStyles["form-select"]}
              value={channel}
              onChange={(e) => setChannel(e.target.value as ScheduledChannelKind)}
            >
              <option value="telegram">Telegram (Automatic)</option>
              <option value="slack">Slack Webhook (Automatic)</option>
              <option value="whatsapp-click">WhatsApp (Manual Click-to-Chat)</option>
              <option value="whatsapp-callmebot">CallMeBot (Experimental)</option>
            </select>
          </div>

          <div className={modalStyles["form-field"]}>
            <label className={modalStyles["form-label"]}>
              {channel === "slack"
                ? "Destination Name / Channel"
                : channel === "whatsapp-click" || channel === "whatsapp-callmebot"
                  ? "Recipient Phone (E.164 e.g. +1234567890)"
                  : "Recipient (Chat ID or Channel)"}
            </label>
            <input
              type="text"
              className={modalStyles["form-input"]}
              placeholder={
                channel === "slack"
                  ? "#general or team destination"
                  : channel === "whatsapp-click"
                    ? "+14155552671"
                    : "123456789 or @channelname"
              }
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className={modalStyles["form-field"]}>
            <label className={modalStyles["form-label"]}>Message</label>
            <textarea
              className={modalStyles["form-textarea"]}
              rows={3}
              placeholder="Write your scheduled message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className={modalStyles["form-row"]}>
            <div className={modalStyles["form-field"]}>
              <label className={modalStyles["form-label"]}>
                <CalendarBlank size={14} />
                <span>Date</span>
              </label>
              <input
                type="date"
                className={modalStyles["form-input"]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className={modalStyles["form-field"]}>
              <label className={modalStyles["form-label"]}>
                <Clock size={14} />
                <span>Time</span>
              </label>
              <input
                type="time"
                className={modalStyles["form-input"]}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={modalStyles["form-field"]}>
            <label className={modalStyles["form-label"]}>
              <Repeat size={14} />
              <span>Repeat</span>
            </label>
            <select
              className={modalStyles["form-select"]}
              value={repeatRule}
              onChange={(e) => setRepeatRule(e.target.value)}
            >
              <option value="">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {channel === "slack" && (
            <label className={modalStyles["form-checkbox-label"]}>
              <input
                type="checkbox"
                checked={allowChannelMentions}
                onChange={(e) => setAllowChannelMentions(e.target.checked)}
              />
              <span>Allow broadcast mentions (@channel, @here)</span>
            </label>
          )}

          {channel === "whatsapp-click" && (
            <div className={modalStyles["channel-honesty-banner"]}>
              <Warning size={15} />
              <span>
                WhatsApp policy requires user interaction: DaVinci will notify you at the scheduled time with a prefilled link to send manually.
              </span>
            </div>
          )}

          <div className={modalStyles["modal-actions"]}>
            <button
              type="button"
              className={styles["btn--secondary"]}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles["btn--primary"]}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
