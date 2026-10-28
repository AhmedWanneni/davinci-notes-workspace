import { describe, it, expect } from "vitest";
import type Database from "@tauri-apps/plugin-sql";
import {
  createScheduledMessage,
  listScheduledMessages,
  updateScheduledMessage,
  deleteScheduledMessage,
} from "./scheduledMessagesStore";
import { withDbLock } from "../vault/sqliteIndex";

function createInMemoryScheduledDb() {
  const rows = new Map<string, Record<string, unknown>>();

  const mockDb = {
    select: async <T>(sql: string, bindValues?: unknown[]): Promise<T> => {
      if (sql.includes("WHERE id = $1") && bindValues?.[0]) {
        const found = rows.get(String(bindValues[0]));
        return (found ? [found] : []) as unknown as T;
      }
      const list = Array.from(rows.values())
        .filter((r) => r.status !== "cancelled")
        .sort((a, b) =>
          String(a.due_at_utc).localeCompare(String(b.due_at_utc)),
        );
      return list as unknown as T;
    },
    execute: async (sql: string, bindValues?: unknown[]) => {
      if (sql.startsWith("INSERT INTO scheduled_messages") && bindValues) {
        const id = String(bindValues[0]);
        rows.set(id, {
          id,
          channel_id: bindValues[1],
          channel_kind: bindValues[2],
          recipient_label: bindValues[3],
          message_text: bindValues[4],
          due_at_utc: bindValues[5],
          tz: bindValues[6],
          local_date: bindValues[7],
          local_time: bindValues[8],
          recurrence_rule: bindValues[9],
          allow_mentions: bindValues[10],
          status: bindValues[11],
          attempts: bindValues[12],
          last_error: bindValues[13],
          last_sent_at: bindValues[14],
          created_at: bindValues[15],
          updated_at: bindValues[16],
        });
      } else if (sql.startsWith("UPDATE scheduled_messages") && bindValues) {
        const id = String(bindValues[15]);
        const existing = rows.get(id);
        if (existing) {
          rows.set(id, {
            ...existing,
            channel_id: bindValues[0],
            channel_kind: bindValues[1],
            recipient_label: bindValues[2],
            message_text: bindValues[3],
            due_at_utc: bindValues[4],
            tz: bindValues[5],
            local_date: bindValues[6],
            local_time: bindValues[7],
            recurrence_rule: bindValues[8],
            allow_mentions: bindValues[9],
            status: bindValues[10],
            attempts: bindValues[11],
            last_error: bindValues[12],
            last_sent_at: bindValues[13],
            updated_at: bindValues[14],
          });
        }
      } else if (sql.startsWith("DELETE FROM scheduled_messages") && bindValues) {
        rows.delete(String(bindValues[0]));
      }
    },
  } as unknown as Database;

  return { mockDb, rows };
}

describe("scheduledMessagesStore — CRUD and withDbLock concurrency", () => {
  it("creates, lists, updates, and deletes scheduled messages", async () => {
    const { mockDb } = createInMemoryScheduledDb();

    const created = await createScheduledMessage(
      {
        id: "smsg_1",
        channelId: "slack-team",
        channelKind: "slack",
        recipientLabel: "#team",
        messageText: "Weekly standup reminder",
        dueAtUtc: "2026-10-29T09:00:00.000Z",
        tz: "Europe/London",
        localDate: "2026-10-29",
        localTime: "09:00",
        recurrenceRule: "/weekly on thu",
        allowMentions: false,
      },
      mockDb,
    );

    expect(created.id).toBe("smsg_1");
    expect(created.status).toBe("scheduled");

    const listed = await listScheduledMessages(mockDb);
    expect(listed).toHaveLength(1);
    expect(listed[0].recipientLabel).toBe("#team");

    const updated = await updateScheduledMessage(
      "smsg_1",
      {
        status: "sent",
        lastSentAt: 1700000000000,
      },
      mockDb,
    );
    expect(updated?.status).toBe("sent");
    expect(updated?.lastSentAt).toBe(1700000000000);

    await deleteScheduledMessage("smsg_1", mockDb);
    const afterDelete = await listScheduledMessages(mockDb);
    expect(afterDelete).toHaveLength(0);
  });

  it("serializes 20 concurrent writes and reads via withDbLock without race corruption", async () => {
    const { mockDb } = createInMemoryScheduledDb();
    const order: number[] = [];

    const tasks = Array.from({ length: 20 }, (_, i) =>
      withDbLock(async () => {
        order.push(i);
        await createScheduledMessage(
          {
            id: `smsg_${i}`,
            channelId: "tg-main",
            channelKind: "telegram",
            recipientLabel: "Personal Bot",
            messageText: `Message ${i}`,
            dueAtUtc: `2026-10-30T10:${String(i).padStart(2, "0")}:00.000Z`,
            tz: "UTC",
            localDate: "2026-10-30",
            localTime: `10:${String(i).padStart(2, "0")}`,
          },
          mockDb,
        );
      }),
    );

    await Promise.all(tasks);
    expect(order).toEqual(Array.from({ length: 20 }, (_, i) => i));
    const all = await listScheduledMessages(mockDb);
    expect(all).toHaveLength(20);
  });
});
