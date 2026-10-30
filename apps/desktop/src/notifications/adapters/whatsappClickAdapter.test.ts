import { describe, it, expect } from "vitest";
import {
  buildWhatsAppClickUrl,
  normalizeWhatsAppPhone,
  prepareWhatsAppClickNotification,
} from "./whatsappClickAdapter";
import {
  sendCallMeBotNotification,
  resetCallMeBotRateLimiterForTests,
} from "./callmebotAdapter";

describe("whatsappClickAdapter & callmebotAdapter", () => {
  it("normalizes international phone numbers and encodes WhatsApp click-to-chat URLs", async () => {
    expect(normalizeWhatsAppPhone("+1 (415) 555-0199")).toBe("14155550199");
    const url = buildWhatsAppClickUrl(
      "+1 (415) 555-0199",
      "Pay invoice #42 & confirm 100% ✅",
    );
    expect(url).toBe(
      "https://wa.me/14155550199?text=Pay%20invoice%20%2342%20%26%20confirm%20100%25%20%E2%9C%85",
    );

    const res = await prepareWhatsAppClickNotification(
      { phoneNumber: "+1 (415) 555-0199" },
      { text: "Hello WhatsApp", sourceKind: "scheduled-message" },
      { openImmediately: false },
    );
    expect(res.ok).toBe(true);
    expect(res.status).toBe("needs_manual_send");
    expect(res.manualActionUrl).toContain("https://wa.me/14155550199");
  });

  it("redacts CallMeBot API key and phone number on error", async () => {
    resetCallMeBotRateLimiterForTests();
    const mockFetch = async () =>
      ({
        ok: false,
        status: 500,
        text: async () => "Upstream error for apikey=SECRET_KEY_777 and +34600112233",
      }) as unknown as Response;

    const res = await sendCallMeBotNotification(
      { phoneNumber: "+34600112233", apiKey: "SECRET_KEY_777" },
      { text: "Ping", sourceKind: "reminder" },
      { fetchImpl: mockFetch, minIntervalMs: 0 },
    );

    expect(res.ok).toBe(false);
    expect(res.error).not.toContain("SECRET_KEY_777");
    expect(res.error).not.toContain("34600112233");
  });
});
