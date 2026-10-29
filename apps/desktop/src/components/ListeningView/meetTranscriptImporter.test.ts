import { describe, expect, it } from "vitest";
import {
  parseVttTranscript,
  parseGoogleMeetTextTranscript,
} from "./meetTranscriptImporter";

describe("meetTranscriptImporter", () => {
  it("parses standard WebVTT subtitles with timestamps and speaker cue", () => {
    const vtt = `WEBVTT

00:00:01.500 --> 00:00:04.200
Alice: Good morning everyone.

00:00:05.100 --> 00:00:08.800
<v Bob>Let's begin our architecture review.`;

    const segments = parseVttTranscript(vtt);
    expect(segments).toHaveLength(2);
    expect(segments[0].startMs).toBe(1500);
    expect(segments[0].endMs).toBe(4200);
    expect(segments[0].text).toBe("Good morning everyone.");
    expect(segments[1].startMs).toBe(5100);
    expect(segments[1].text).toBe("Let's begin our architecture review.");
  });

  it("parses Google Meet plain text transcripts with name and time header", () => {
    const doc = `Alice Smith - 10:00 AM
Hello team, welcome to the kickoff.

Bob Jones - 10:01 AM
Thanks Alice, excited to be here.`;

    const segments = parseGoogleMeetTextTranscript(doc);
    expect(segments).toHaveLength(2);
    expect(segments[0].text).toBe("Hello team, welcome to the kickoff.");
    expect(segments[1].text).toBe("Thanks Alice, excited to be here.");
  });
});
