import { useState, useMemo, type JSX } from "react";
import {
  CaretDown,
  CaretRight,
  PaperPlaneTilt,
  Plus,
  Warning,
  WhatsappLogo,
} from "@phosphor-icons/react";
import type { ScheduledMessageRecord } from "../../reminders/scheduledMessagesStore";
import type { ScheduledFilter } from "./types";
import { TodoScheduledRow } from "./TodoScheduledRow";
import styles from "./TodosScheduledContent.module.scss";

export interface TodosScheduledContentProps {
  items: readonly ScheduledMessageRecord[];
  searchQuery: string;
  filter: ScheduledFilter;
  onSendNow: (item: ScheduledMessageRecord) => void;
  onCancel: (id: string) => void;
  onNewMessage: () => void;
}

export function TodosScheduledContent({
  items,
  searchQuery,
  filter,
  onSendNow,
  onCancel,
  onNewMessage,
}: TodosScheduledContentProps): JSX.Element {
  const [showSent, setShowSent] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((msg) => {
      if (filter !== "all" && msg.status !== filter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        msg.messageText.toLowerCase().includes(q) ||
        msg.recipientLabel.toLowerCase().includes(q) ||
        msg.channelKind.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, filter]);

  const scheduled = useMemo(() => filtered.filter((i) => i.status === "scheduled"), [filtered]);
  const manual = useMemo(() => filtered.filter((i) => i.status === "needs_manual_send"), [filtered]);
  const missed = useMemo(() => filtered.filter((i) => i.status === "missed" || i.status === "failed"), [filtered]);
  const sent = useMemo(() => filtered.filter((i) => i.status === "sent"), [filtered]);

  const renderSection = (
    title: string,
    sectionItems: ScheduledMessageRecord[],
    iconVariant?: "manual" | "missed",
  ) => {
    if (sectionItems.length === 0) return null;
    return (
      <section className={styles["todos-scheduled__section"]}>
        <div className={styles["todos-scheduled__section-header"]}>
          {iconVariant === "manual" && <WhatsappLogo size={15} color="#25d366" />}
          {iconVariant === "missed" && <Warning size={15} color="#ef4444" weight="bold" />}
          <h2
            className={`${styles["todos-scheduled__section-title"]} ${
              iconVariant ? styles[`is-${iconVariant}`] : ""
            }`}
          >
            {title}
          </h2>
          <span className={styles["todos-scheduled__count"]}>{sectionItems.length}</span>
        </div>
        <div className={styles["todos-scheduled__list"]}>
          {sectionItems.map((item) => (
            <TodoScheduledRow
              key={item.id}
              item={item}
              onSendNow={onSendNow}
              onCancel={onCancel}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className={styles["todos-scheduled"]} data-testid="todos-scheduled-content">
      <div className={styles["todos-scheduled__top-bar"]}>
        <span className={styles["todos-scheduled__hint"]}>
          Automated and queued messages to Telegram, WhatsApp, Slack, etc.
        </span>
        <button
          type="button"
          className={styles["todos-scheduled__add-btn"]}
          onClick={onNewMessage}
        >
          <Plus size={13} weight="bold" />
          <span>Schedule Message</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--color-text-muted)" }}>
          <PaperPlaneTilt size={36} style={{ marginBottom: 8, opacity: 0.6 }} />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
            {searchQuery ? "No matching scheduled messages" : "No scheduled messages yet"}
          </p>
        </div>
      ) : (
        <>
          {renderSection("Pending / Scheduled", scheduled)}
          {renderSection("Needs Manual Send", manual, "manual")}
          {renderSection("Missed / Delivery Failed", missed, "missed")}
          {sent.length > 0 && (
            <section className={styles["todos-scheduled__section"]}>
              <button
                type="button"
                className={styles["todos-scheduled__toggle-btn"]}
                onClick={() => setShowSent((v) => !v)}
              >
                {showSent ? <CaretDown size={14} /> : <CaretRight size={14} />}
                <span>Sent History ({sent.length})</span>
              </button>
              {showSent && (
                <div className={styles["todos-scheduled__list"]}>
                  {sent.map((item) => (
                    <TodoScheduledRow
                      key={item.id}
                      item={item}
                      onSendNow={onSendNow}
                      onCancel={onCancel}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
