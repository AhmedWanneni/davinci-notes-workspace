import type Database from "@tauri-apps/plugin-sql";
import { getVaultIndexDb, withDbLock, withDbTransaction } from "../vault/sqliteIndex";

export type ScheduledMessageStatus =
  | "scheduled" | "sending" | "sent" | "failed" | "needs_manual_send" | "missed" | "cancelled";

export type ScheduledChannelKind =
  | "desktop" | "telegram" | "slack" | "whatsapp-click" | "whatsapp-callmebot";

export interface ScheduledMessageItem {
  id: string;
  channelId: string;
  channelKind: ScheduledChannelKind;
  recipientLabel: string;
  messageText: string;
  dueAtUtc: string;
  tz: string;
  localDate: string;
  localTime: string;
  recurrenceRule: string | null;
  allowMentions: boolean;
  status: ScheduledMessageStatus;
  attempts: number;
  lastError: string | null;
  lastSentAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export type ScheduledMessageRecord = ScheduledMessageItem;

export interface CreateScheduledMessageInput {
  id?: string;
  channelId?: string;
  channelKind?: ScheduledChannelKind;
  channel?: ScheduledChannelKind;
  recipientLabel?: string;
  recipient?: string;
  messageText?: string;
  message?: string;
  dueAtUtc: string;
  tz?: string;
  localDate?: string;
  localTime?: string;
  repeatRule?: string | null;
  recurrenceRule?: string | null;
  allowMentions?: boolean;
  allowChannelMentions?: boolean;
}

export interface UpdateScheduledMessageInput {
  channelId?: string;
  channelKind?: ScheduledChannelKind;
  recipientLabel?: string;
  messageText?: string;
  dueAtUtc?: string;
  tz?: string;
  localDate?: string;
  localTime?: string;
  recurrenceRule?: string | null;
  allowMentions?: boolean;
  status?: ScheduledMessageStatus;
  attempts?: number;
  lastError?: string | null;
  lastSentAt?: number | null;
}

interface ScheduledMessageRow {
  id: string;
  channel_id: string;
  channel_kind: ScheduledChannelKind;
  recipient_label: string;
  message_text: string;
  due_at_utc: string;
  tz: string;
  local_date: string;
  local_time: string;
  recurrence_rule: string | null;
  allow_mentions: number;
  status: ScheduledMessageStatus;
  attempts: number;
  last_error: string | null;
  last_sent_at: number | null;
  created_at: number;
  updated_at: number;
}

function rowToItem(r: ScheduledMessageRow): ScheduledMessageItem {
  return {
    id: r.id,
    channelId: r.channel_id,
    channelKind: r.channel_kind,
    recipientLabel: r.recipient_label,
    messageText: r.message_text,
    dueAtUtc: r.due_at_utc,
    tz: r.tz,
    localDate: r.local_date,
    localTime: r.local_time,
    recurrenceRule: r.recurrence_rule,
    allowMentions: r.allow_mentions !== 0,
    status: r.status,
    attempts: r.attempts,
    lastError: r.last_error,
    lastSentAt: r.last_sent_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listScheduledMessages(
  dbOverride?: Database | null,
): Promise<ScheduledMessageItem[]> {
  const db = dbOverride ?? (await getVaultIndexDb());
  const rows = await withDbLock(() =>
    db.select<ScheduledMessageRow[]>(
      `SELECT * FROM scheduled_messages WHERE status != 'cancelled' ORDER BY due_at_utc ASC, created_at DESC`,
    ),
  );
  return rows.map(rowToItem);
}

export async function createScheduledMessage(
  input: CreateScheduledMessageInput,
  dbOverride?: Database | null,
): Promise<ScheduledMessageItem> {
  const db = dbOverride ?? (await getVaultIndexDb());
  const now = Date.now();
  const id = input.id ?? `smsg_${crypto.randomUUID()}`;
  const kind = input.channelKind ?? input.channel ?? "telegram";
  const item: ScheduledMessageItem = {
    id,
    channelId: input.channelId ?? kind,
    channelKind: kind,
    recipientLabel: input.recipientLabel ?? input.recipient ?? "",
    messageText: input.messageText ?? input.message ?? "",
    dueAtUtc: input.dueAtUtc,
    tz: input.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    localDate: input.localDate ?? input.dueAtUtc.slice(0, 10),
    localTime: input.localTime ?? input.dueAtUtc.slice(11, 16),
    recurrenceRule: input.recurrenceRule ?? input.repeatRule ?? null,
    allowMentions: Boolean(input.allowMentions ?? input.allowChannelMentions),
    status: "scheduled",
    attempts: 0,
    lastError: null,
    lastSentAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await withDbLock(() =>
    withDbTransaction(db, () =>
      db.execute(
        `INSERT INTO scheduled_messages (
           id, channel_id, channel_kind, recipient_label, message_text,
           due_at_utc, tz, local_date, local_time, recurrence_rule,
           allow_mentions, status, attempts, last_error, last_sent_at,
           created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          item.id, item.channelId, item.channelKind, item.recipientLabel, item.messageText,
          item.dueAtUtc, item.tz, item.localDate, item.localTime, item.recurrenceRule,
          item.allowMentions ? 1 : 0, item.status, item.attempts, item.lastError,
          item.lastSentAt, item.createdAt, item.updatedAt,
        ],
      ),
    ),
  );
  return item;
}

export async function updateScheduledMessage(
  id: string,
  patch: UpdateScheduledMessageInput,
  dbOverride?: Database | null,
): Promise<ScheduledMessageItem | null> {
  const db = dbOverride ?? (await getVaultIndexDb());
  const now = Date.now();

  return withDbLock(() =>
    withDbTransaction(db, async () => {
      const existing = await db.select<ScheduledMessageRow[]>(
        `SELECT * FROM scheduled_messages WHERE id = $1`, [id],
      );
      if (existing.length === 0) return null;
      const cur = rowToItem(existing[0]);
      const next: ScheduledMessageItem = {
        ...cur, ...patch,
        recurrenceRule: patch.recurrenceRule !== undefined ? patch.recurrenceRule : cur.recurrenceRule,
        lastError: patch.lastError !== undefined ? patch.lastError : cur.lastError,
        lastSentAt: patch.lastSentAt !== undefined ? patch.lastSentAt : cur.lastSentAt,
        updatedAt: now,
      };

      await db.execute(
        `UPDATE scheduled_messages
         SET channel_id = $1, channel_kind = $2, recipient_label = $3,
             message_text = $4, due_at_utc = $5, tz = $6, local_date = $7,
             local_time = $8, recurrence_rule = $9, allow_mentions = $10,
             status = $11, attempts = $12, last_error = $13, last_sent_at = $14,
             updated_at = $15
         WHERE id = $16`,
        [
          next.channelId, next.channelKind, next.recipientLabel, next.messageText,
          next.dueAtUtc, next.tz, next.localDate, next.localTime, next.recurrenceRule,
          next.allowMentions ? 1 : 0, next.status, next.attempts, next.lastError,
          next.lastSentAt, next.updatedAt, id,
        ],
      );
      return next;
    }),
  );
}

export async function deleteScheduledMessage(id: string, dbOverride?: Database | null): Promise<void> {
  const db = dbOverride ?? (await getVaultIndexDb());
  await withDbLock(() =>
    withDbTransaction(db, () => db.execute(`DELETE FROM scheduled_messages WHERE id = $1`, [id])),
  );
}

export async function cancelScheduledMessage(id: string, dbOverride?: Database | null): Promise<ScheduledMessageItem | null> {
  return updateScheduledMessage(id, { status: "cancelled" }, dbOverride);
}

export async function markScheduledMessageSent(id: string, dbOverride?: Database | null): Promise<ScheduledMessageItem | null> {
  return updateScheduledMessage(id, { status: "sent", lastSentAt: Date.now(), lastError: null }, dbOverride);
}

export async function markScheduledMessageFailed(id: string, error: string, dbOverride?: Database | null): Promise<ScheduledMessageItem | null> {
  return updateScheduledMessage(id, { status: "failed", lastError: error }, dbOverride);
}

export async function markScheduledMessageMissed(id: string, dbOverride?: Database | null): Promise<ScheduledMessageItem | null> {
  return updateScheduledMessage(id, { status: "missed" }, dbOverride);
}
