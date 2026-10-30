import type { TranscriptSegmentItem } from "./listeningTypes";

function parseVttTimestamp(timestamp: string): number {
  const parts = timestamp.trim().split(":");
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const secondsParts = parts[2].split(/[.,]/);
    const seconds = parseInt(secondsParts[0], 10) || 0;
    const millis = parseInt(secondsParts[1] || "0", 10) || 0;
    return (hours * 3600 + minutes * 60 + seconds) * 1000 + millis;
  }
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0;
    const secondsParts = parts[1].split(/[.,]/);
    const seconds = parseInt(secondsParts[0], 10) || 0;
    const millis = parseInt(secondsParts[1] || "0", 10) || 0;
    return (minutes * 60 + seconds) * 1000 + millis;
  }
  return 0;
}

export function parseVttTranscript(
  vttContent: string,
): TranscriptSegmentItem[] {
  const lines = vttContent.replace(/\r\n/g, "\n").split("\n");
  const segments: TranscriptSegmentItem[] = [];

  let currentStart = 0;
  let currentEnd = 0;
  let currentTextLines: string[] = [];
  const timeRegex =
    /((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})/;

  const flush = () => {
    if (currentTextLines.length > 0) {
      const fullText = currentTextLines.join(" ").trim();
      const speaker: "me" | "meeting" = "meeting";
      let cleanText = fullText;

      const speakerMatch =
        fullText.match(/^<v\s+([^>]+)>(.*)$/i) ||
        fullText.match(/^([A-Za-z0-9 _-]+):\s*(.*)$/);
      if (speakerMatch) {
        cleanText = speakerMatch[2].trim();
      }

      if (cleanText) {
        segments.push({
          id: `vtt_${segments.length}_${Date.now()}`,
          speaker,
          text: cleanText,
          startMs: currentStart,
          endMs: currentEnd,
          isFinal: true,
        });
      }
      currentTextLines = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "WEBVTT") continue;

    const match = trimmed.match(timeRegex);
    if (match) {
      flush();
      currentStart = parseVttTimestamp(match[1]);
      currentEnd = parseVttTimestamp(match[2]);
    } else if (currentStart > 0 || currentEnd > 0) {
      currentTextLines.push(trimmed);
    }
  }

  flush();
  return segments;
}

export function parseGoogleMeetTextTranscript(
  textContent: string,
): TranscriptSegmentItem[] {
  const lines = textContent.replace(/\r\n/g, "\n").split("\n");
  const segments: TranscriptSegmentItem[] = [];
  const headerRegex =
    /^([A-Za-z0-9 _-]+)\s+[-–—]\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i;

  let currentSpeaker = "Meeting";
  let currentTextLines: string[] = [];
  let roughTimeMs = 0;

  const flush = () => {
    if (currentTextLines.length > 0) {
      const text = currentTextLines.join(" ").trim();
      if (text) {
        segments.push({
          id: `meet_${segments.length}_${Date.now()}`,
          speaker: currentSpeaker.toLowerCase().includes("you")
            ? "me"
            : "meeting",
          text,
          startMs: roughTimeMs,
          endMs: roughTimeMs + 5000,
          isFinal: true,
        });
        roughTimeMs += 5000;
      }
      currentTextLines = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(headerRegex);
    if (match) {
      flush();
      currentSpeaker = match[1].trim();
    } else {
      currentTextLines.push(trimmed);
    }
  }

  flush();
  return segments;
}
