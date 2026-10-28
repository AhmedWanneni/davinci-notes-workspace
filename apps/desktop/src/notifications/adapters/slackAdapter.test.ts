import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sanitizeSlackMentions,
  sendSlackNotification,
  resetSlackRateLimiterForTests,
} from "./slackAdapter";

describe("slackAdapter — mention safety, webhooks, and rate limits", () => {
  const validSecret = {
    webhookUrl:
      "https://hooks.slack.com/services/T11111111/B22222222/SecretWebhookToken999",
  };

  beforeEach(() => {
    resetSlackRateLimiterForTests();
  });

  it("neutralizes @channel, @here, @everyone, <!channel>, and <!here> on automated reminders", () => {
    const sanitized = sanitizeSlackMentions(
      "Alert @channel and @here and <!channel> and <!everyone|everyone> now",
      { sourceKind: "reminder", allowChannelMentions: true },
    );
    expect(sanitized).not.toContain("<!channel>");
    expect(sanitized).not.toContain("<!here>");
    expect(sanitized).not.toContain("<!everyone");
    expect(sanitized).toContain("@\u200Bchannel");
    expect(sanitized).toContain("@\u200Bhere");
    expect(sanitized).toContain("@\u200Beveryone");
  });

  it("neutralizes @channel on scheduled messages when allowChannelMentions is false, and converts when true", () => {
    const blocked = sanitizeSlackMentions("Hey @channel check this", {
      sourceKind: "scheduled-message",
      allowChannelMentions: false,
    });
    expect(blocked).toBe("Hey @\u200Bchannel check this");

    const allowed = sanitizeSlackMentions(
      "Hey @channel and <!here> check this",
      {
        sourceKind: "scheduled-message",
        allowChannelMentions: true,
      },
    );
    expect(allowed).toContain("Hey <!channel>");
    // Raw injected <!here> was still neutralized unless written as @here
    expect(allowed).toContain("@\u200Bhere");
  });

  it("posts JSON payload to Slack webhook and redacts webhook URL on 403/404", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () =>
        `action_prohibited for ${validSecret.webhookUrl}`,
    });

    const res = await sendSlackNotification(
      validSecret,
      {
        title: "Deploy",
        text: "Check @channel status",
        sourceKind: "reminder",
      },
      { fetchImpl: mockFetch as unknown as typeof fetch, minIntervalMs: 0 },
    );

    expect(res.ok).toBe(false);
    expect(res.retryable).toBe(false);
    expect(res.error).toContain("Slack webhook revoked, archived, or restricted");
    expect(res.error).not.toContain("SecretWebhookToken999");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(String(init.body));
    expect(sent.text).toContain("@\u200Bchannel");
  });
});
