import React, { useState } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import type { ScheduledMessageRecord, ScheduledMessageStatus } from "../../reminders/scheduledMessagesStore";
import { ScheduledMessageRow } from "./ScheduledMessageRow";
import styles from "./RemindersView.module.scss";
import scheduledStyles from "./ScheduledMessages.module.scss";

export interface ScheduledMessagesSubViewProps {
  items: readonly ScheduledMessageRecord[];
  searchQuery: string;
  onSendNow: (item: ScheduledMessageRecord) => void;
  onCancel: (id: string) => void;
  onEdit: (item: ScheduledMessageRecord) => void;
  onNewMessage: () => void;
}

type FilterOption = "all" | ScheduledMessageStatus;

export function ScheduledMessagesSubView({
  items,
  searchQuery,
  onSendNow,
  onCancel,
  onEdit,
  onNewMessage,
}: ScheduledMessagesSubViewProps) {
  const [filter, setFilter] = useState<FilterOption>("all");

  const filteredItems = items.filter((msg) => {
    if (filter !== "all" && msg.status !== filter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      msg.messageText.toLowerCase().includes(q) ||
      msg.recipientLabel.toLowerCase().includes(q) ||
      msg.channelKind.toLowerCase().includes(q)
    );
  });

  const scheduledCount = items.filter((i) => i.status === "scheduled").length;
  const manualCount = items.filter((i) => i.status === "needs_manual_send").length;
  const missedCount = items.filter((i) => i.status === "missed").length;

  return (
    <div className={scheduledStyles["scheduled-subview"]}>
      <div className={scheduledStyles["scheduled-filter-bar"]}>
        <button
          type="button"
          className={`${scheduledStyles["scheduled-filter-chip"]} ${filter === "all" ? scheduledStyles["scheduled-filter-chip--active"] : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({items.length})
        </button>
        <button
          type="button"
          className={`${scheduledStyles["scheduled-filter-chip"]} ${filter === "scheduled" ? scheduledStyles["scheduled-filter-chip--active"] : ""}`}
          onClick={() => setFilter("scheduled")}
        >
          Scheduled ({scheduledCount})
        </button>
        {manualCount > 0 && (
          <button
            type="button"
            className={`${scheduledStyles["scheduled-filter-chip"]} ${styles["scheduled-filter-chip--manual"]} ${
              filter === "needs_manual_send" ? scheduledStyles["scheduled-filter-chip--active"] : ""
            }`}
            onClick={() => setFilter("needs_manual_send")}
          >
            Needs Send ({manualCount})
          </button>
        )}
        {missedCount > 0 && (
          <button
            type="button"
            className={`${scheduledStyles["scheduled-filter-chip"]} ${styles["scheduled-filter-chip--missed"]} ${
              filter === "missed" ? scheduledStyles["scheduled-filter-chip--active"] : ""
            }`}
            onClick={() => setFilter("missed")}
          >
            Missed ({missedCount})
          </button>
        )}
        <button
          type="button"
          className={`${scheduledStyles["scheduled-filter-chip"]} ${filter === "sent" ? scheduledStyles["scheduled-filter-chip--active"] : ""}`}
          onClick={() => setFilter("sent")}
        >
          Sent
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className={styles["reminders-empty"]}>
          {searchQuery || filter !== "all" ? (
            <>
              <p className={styles["reminders-empty__title"]}>No matching scheduled messages</p>
              <p className={styles["reminders-empty__sub"]}>Try clearing your filter or search terms.</p>
            </>
          ) : (
            <>
              <PaperPlaneTilt size={40} className={styles["reminders-empty__icon"]} />
              <p className={styles["reminders-empty__title"]}>No scheduled messages</p>
              <p className={styles["reminders-empty__sub"]}>
                Compose a scheduled reminder or automated notification to Telegram, Slack, or WhatsApp.
              </p>
              <button type="button" className={styles["btn--primary"]} onClick={onNewMessage}>
                Schedule Message
              </button>
            </>
          )}
        </div>
      ) : (
        <div className={scheduledStyles["scheduled-list"]}>
          {filteredItems.map((item) => (
            <ScheduledMessageRow
              key={item.id}
              item={item}
              onSendNow={onSendNow}
              onCancel={onCancel}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
