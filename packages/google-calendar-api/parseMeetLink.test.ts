import { describe, expect, it } from "vitest";
import { parseMeetLink } from "./parseMeetLink";
import type { GoogleCalendarApiEvent } from "./calendarTypes";

describe("parseMeetLink", () => {
  it("extracts direct hangoutLink", () => {
    const event: GoogleCalendarApiEvent = {
      id: "evt-1",
      hangoutLink: "https://meet.google.com/abc-defg-hij",
    };
    expect(parseMeetLink(event)).toBe("https://meet.google.com/abc-defg-hij");
  });

  it("extracts video entryPoint from conferenceData", () => {
    const event: GoogleCalendarApiEvent = {
      id: "evt-2",
      conferenceData: {
        entryPoints: [
          { entryPointType: "phone", uri: "tel:+1234567890", pin: "123" },
          { entryPointType: "video", uri: "https://meet.google.com/xyz-uvwx-rst" },
        ],
      },
    };
    expect(parseMeetLink(event)).toBe("https://meet.google.com/xyz-uvwx-rst");
  });

  it("extracts Meet link from event location text", () => {
    const event: GoogleCalendarApiEvent = {
      id: "evt-3",
      location: "Room 101 or join at https://meet.google.com/klm-nopq-rst",
    };
    expect(parseMeetLink(event)).toBe("https://meet.google.com/klm-nopq-rst");
  });

  it("extracts Meet link from event description", () => {
    const event: GoogleCalendarApiEvent = {
      id: "evt-4",
      description: "Meeting Agenda:\nLink: https://meet.google.com/qwe-rtyu-iop?authuser=0\nNotes below.",
    };
    expect(parseMeetLink(event)).toBe("https://meet.google.com/qwe-rtyu-iop?authuser=0");
  });

  it("prioritizes hangoutLink over description links", () => {
    const event: GoogleCalendarApiEvent = {
      id: "evt-5",
      hangoutLink: "https://meet.google.com/primary-link",
      description: "Old link: https://meet.google.com/old-link",
    };
    expect(parseMeetLink(event)).toBe("https://meet.google.com/primary-link");
  });

  it("rejects malicious or invalid URLs", () => {
    const event: GoogleCalendarApiEvent = {
      id: "evt-6",
      hangoutLink: "javascript:alert(1)",
    };
    expect(parseMeetLink(event)).toBeUndefined();
  });

  it("returns undefined when no video link is present", () => {
    const event: GoogleCalendarApiEvent = {
      id: "evt-7",
      summary: "In-person coffee",
      location: "Cafeteria",
    };
    expect(parseMeetLink(event)).toBeUndefined();
  });
});
