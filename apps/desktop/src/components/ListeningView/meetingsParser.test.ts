import { describe, expect, it } from "vitest";
import { parseMeetingMarkdown } from "./meetingsParser";

describe("meetingsParser", () => {
  const sampleMarkdown = `---
title: "Quarterly Planning"
date: 2026-11-02
time: "14:00"
tags:
  - meeting
duration_seconds: 1800
---

# Quarterly Planning

## Summary
The engineering team finalized Q4 goals and resolved cloud architecture questions.

## Action Items
- [ ] Deploy v0.3.0 to staging
- [ ] Prepare load testing scripts

## Q&A
**Q: What is our target release date?**
A: Next Friday at 5 PM.

## Suggested Follow-up Questions
- Who will lead performance testing?
- Are rollback procedures documented?

## Related Notes
- [[Cloud Architecture]] — Primary infrastructure plan

## Audio Recording
![[2026-11-02 - Quarterly Planning.wav]]

## Transcript
### 00:00 — Me
Welcome everyone to the quarterly planning session.

### 00:15 — Meeting
Thanks, let's start with milestone review.
`;

  it("parses frontmatter metadata correctly", () => {
    const parsed = parseMeetingMarkdown("Meetings/2026-11-02 - Quarterly Planning.md", sampleMarkdown);
    expect(parsed.title).toBe("Quarterly Planning");
    expect(parsed.date).toBe("2026-11-02");
    expect(parsed.time).toBe("14:00");
    expect(parsed.durationSeconds).toBe(1800);
    expect(parsed.audioFileName).toBe("2026-11-02 - Quarterly Planning.wav");
  });

  it("parses summary, action items, Q&A, and questions", () => {
    const parsed = parseMeetingMarkdown("Meetings/test.md", sampleMarkdown);
    expect(parsed.summary).toContain("The engineering team finalized Q4 goals");
    expect(parsed.actionItems).toEqual([
      "Deploy v0.3.0 to staging",
      "Prepare load testing scripts",
    ]);
    expect(parsed.answers).toHaveLength(1);
    expect(parsed.answers[0].question).toBe("What is our target release date?");
    expect(parsed.answers[0].answer).toBe("Next Friday at 5 PM.");
    expect(parsed.questions).toEqual([
      "Who will lead performance testing?",
      "Are rollback procedures documented?",
    ]);
    expect(parsed.relatedNotes).toEqual([
      { title: "Cloud Architecture", reason: "Primary infrastructure plan" },
    ]);
  });

  it("parses transcript blocks with timestamps and speakers", () => {
    const parsed = parseMeetingMarkdown("Meetings/test.md", sampleMarkdown);
    expect(parsed.transcript).toHaveLength(2);
    expect(parsed.transcript[0]).toEqual({
      offset: "00:00",
      speaker: "Me",
      text: "Welcome everyone to the quarterly planning session.",
    });
    expect(parsed.transcript[1]).toEqual({
      offset: "00:15",
      speaker: "Meeting",
      text: "Thanks, let's start with milestone review.",
    });
  });
});
