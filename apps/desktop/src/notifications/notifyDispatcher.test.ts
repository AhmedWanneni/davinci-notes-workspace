import { describe, it, expect, vi, beforeEach } from "vitest";
import type Database from "@tauri-apps/plugin-sql";
import {
  loadChannelDestinations,
  loadChannelSecret,
  removeChannelDestination,
  setNotificationSecretTestMode,
  subscribeNotificationLogs,
  upsertChannelDestination,
} from "./channelConfigStore";
import { notify } from "./notifyDispatcher";
import type { ChannelDestinationMeta, TelegramSecret } from "./channelTypes";

function createMockSettingsDb() {
  const settingsMap = new Map<string, string>();
  const db = {
    select: async <T>(_sql: string, bind?: unknown[]): Promise<T> => {
      const k = String(bind?.[0] ?? "");
      const val = settingsMap.get(k);
      return (val ? [{ value: val }] : []) as unknown as T;
    },
    execute: async (_sql: string, bind?: unknown[]) => {
      if (bind && bind.length >= 2) {
        settingsMap.set(String(bind[0]), String(bind[1]));
      }
    },
  } as unknown as Database;
  return { db, settingsMap };
}

describe("notifyDispatcher & channelConfigStore — adversarial secret & backoff tests", () => {
  beforeEach(() => {
    setNotificationSecretTestMode(true);
  });

  it("stores secrets only in keychain store, never in SQLite settings, and deletes on remove", async () => {
    const { db, settingsMap } = createMockSettingsDb();
    const tgMeta: ChannelDestinationMeta = {
      id: "tg-personal",
      kind: "telegram",
      name: "My Bot",
      enabled: true,
      isDefaultForReminders: true,
      status: "unverified",
      recipientHint: "Chat 998877",
      createdAt: 1700000000000,
    };
    const secret: TelegramSecret = {
      botToken: "777888999:AAH_topSecretTelegramTokenXYZ",
      chatId: "998877",
    };

    await upsertChannelDestination(tgMeta, secret, db);

    // Verify SQLite settings JSON contains 0 traces of botToken
    const rawSettingsJson = settingsMap.get("notification_channels_config") ?? "";
    expect(rawSettingsJson).toContain("tg-personal");
    expect(rawSettingsJson).not.toContain("AAH_topSecretTelegramTokenXYZ");

    // Verify secret is present in keychain store
    const loadedSecret = await loadChannelSecret<TelegramSecret>("tg-personal");
    expect(loadedSecret?.botToken).toBe(secret.botToken);

    // Remove destination and confirm secret is immediately gone
    await removeChannelDestination("tg-personal", db);
    const afterRemoveSecret =
      await loadChannelSecret<TelegramSecret>("tg-personal");
    expect(afterRemoveSecret).toBeNull();
    const remaining = await loadChannelDestinations(db);
    expect(remaining.some((d) => d.id === "tg-personal")).toBe(false);
  });

  it("retries network failures with exponential backoff and surfaces redacted error in logs and destination state", async () => {
    const { db, settingsMap } = createMockSettingsDb();
    const tgMeta: ChannelDestinationMeta = {
      id: "tg-retry",
      kind: "telegram",
      name: "Retry Bot",
      enabled: true,
      isDefaultForReminders: true,
      status: "connected",
      createdAt: 1700000000000,
    };
    const secret: TelegramSecret = {
      botToken: "111222333:AAH_secretForRetryTestOnly123",
      chatId: "555666",
    };
    await upsertChannelDestination(tgMeta, secret, db);

    const logEvents: string[] = [];
    const unsubscribe = subscribeNotificationLogs((line) => {
      logEvents.push(line);
    });

    let callCount = 0;
    const failingFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      throw new Error(
        `Network unreachable when calling https://api.telegram.org/bot${secret.botToken}/sendMessage`,
      );
    });

    try {
      const res = await notify(
        tgMeta,
        {
          title: "Due Task",
          text: "Submit report",
          sourceKind: "reminder",
        },
        {
          fetchImpl: failingFetch as unknown as typeof fetch,
          maxRetries: 2,
          baseBackoffMs: 1,
          dbOverride: db,
        },
      );

      expect(callCount).toBe(3); // Initial + 2 retries
      expect(res.ok).toBe(false);
      expect(res.error).toContain("Telegram network failure");
      expect(res.error).not.toContain(secret.botToken);

      // Check logs and SQLite never contain the token
      const combinedLogs = logEvents.join("\n");
      expect(combinedLogs).toContain("Delivery failed on Retry Bot");
      expect(combinedLogs).not.toContain(secret.botToken);
      expect(settingsMap.get("notification_channels_config")).not.toContain(
        secret.botToken,
      );
    } finally {
      unsubscribe();
    }
  });
});
