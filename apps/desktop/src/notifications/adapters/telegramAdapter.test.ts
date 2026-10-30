import { describe, it, expect, vi } from "vitest";
import { sendTelegramNotification } from "./telegramAdapter";

describe("telegramAdapter — adversarial HTTP & error handling", () => {
  const secret = {
    botToken: "123456789:AAH_validLookingTokenForTests999",
    chatId: "42424242",
  };

  it("sends message via Telegram Bot API on 200 OK", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    const res = await sendTelegramNotification(
      secret,
      {
        title: "Standup",
        text: "Join call",
        sourceKind: "reminder",
        notePath: "Daily/2026-10-28.md",
        line: 12,
      },
      mockFetch as unknown as typeof fetch,
    );

    expect(res.ok).toBe(true);
    expect(res.status).toBe("sent");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain(secret.botToken);
    const parsedBody = JSON.parse(String(init.body));
    expect(parsedBody.chat_id).toBe("42424242");
    expect(parsedBody.text).toContain("Join call");
    expect(parsedBody.text).toContain("Daily/2026-10-28.md:L12");
  });

  it("handles 401 Unauthorized (invalid/revoked bot token) as non-retryable and redacts token", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        ok: false,
        description: `Unauthorized for ${secret.botToken}`,
      }),
    });

    const res = await sendTelegramNotification(
      secret,
      { text: "Test", sourceKind: "test" },
      mockFetch as unknown as typeof fetch,
    );

    expect(res.ok).toBe(false);
    expect(res.retryable).toBe(false);
    expect(res.error).toContain("401 Unauthorized");
    expect(res.error).not.toContain(secret.botToken);
  });

  it("handles 400 Bad Request (chat not found / bot not started) with actionable guidance", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        ok: false,
        description: "Bad Request: chat not found",
      }),
    });

    const res = await sendTelegramNotification(
      secret,
      { text: "Test", sourceKind: "test" },
      mockFetch as unknown as typeof fetch,
    );

    expect(res.ok).toBe(false);
    expect(res.retryable).toBe(false);
    expect(res.error).toContain("send /start");
  });

  it("handles 429 rate limit with retry_after", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        ok: false,
        parameters: { retry_after: 3 },
      }),
    });

    const res = await sendTelegramNotification(
      secret,
      { text: "Burst", sourceKind: "scheduled-message" },
      mockFetch as unknown as typeof fetch,
    );

    expect(res.ok).toBe(false);
    expect(res.retryable).toBe(true);
    expect(res.retryAfterMs).toBe(3000);
  });
});
