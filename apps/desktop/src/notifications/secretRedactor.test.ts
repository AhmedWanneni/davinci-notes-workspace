import { describe, it, expect } from "vitest";
import { redactSecrets } from "./secretRedactor";

describe("secretRedactor — adversarial secret stripping", () => {
  it("redacts Telegram bot tokens in URLs and raw strings", () => {
    const raw =
      "POST https://api.telegram.org/bot987654321:AAH_superSecretBotToken123456/sendMessage failed with token 987654321:AAH_superSecretBotToken123456";
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain("AAH_superSecretBotToken123456");
    expect(redacted).toContain("https://api.telegram.org/bot[REDACTED]/");
    expect(redacted).toContain("[REDACTED_BOT_TOKEN]");
  });

  it("redacts Slack Incoming Webhook URLs", () => {
    const raw =
      "Error sending to https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX (HTTP 403)";
    const redacted = redactSecrets(raw);
    expect(redacted).not.toContain("T00000000");
    expect(redacted).not.toContain("XXXXXXXXXXXXXXXXXXXXXXXX");
    expect(redacted).toContain("https://hooks.slack.com/services/[REDACTED]");
  });

  it("redacts CallMeBot apikey and phone query parameters and explicit secrets", () => {
    const raw =
      "GET https://api.callmebot.com/whatsapp.php?phone=%2B34123456789&text=hi&apikey=99887766 failed for +34123456789";
    const redacted = redactSecrets(raw, ["99887766", "+34123456789"]);
    expect(redacted).not.toContain("99887766");
    expect(redacted).not.toContain("34123456789");
  });
});
