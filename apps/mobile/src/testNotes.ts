/**
 * Test note generators for 200-line, 2,000-line, and 10,000-line documents
 * heavily decorated with Markdown headings, wikilinks, tags, checkboxes,
 * strikethrough, highlights, and tables.
 */

export function generateTestNote(lineCount: number): string {
  const lines: string[] = [];
  lines.push(`# Mobile Spike Test Document (${lineCount} lines)`);
  lines.push("");
  lines.push("This document contains live-preview markdown decorations for mobile testing.");
  lines.push("Metadata: #status/testing #platform/mobile #suite/live-preview");
  lines.push("");

  let currentLine = lines.length;
  let sectionIndex = 1;

  while (currentLine < lineCount) {
    // Add a section header
    lines.push(`## Section ${sectionIndex}: Core Features and Sync`);
    lines.push("");
    lines.push(
      `Overview of section ${sectionIndex} referencing [[Project Overview]] and [[Architecture Doc#Storage]].`,
    );
    lines.push(
      `Status is ==critical== and prior approach is ~~deprecated~~. See [Documentation](https://davinci.notes).`,
    );
    lines.push("");

    // Add task checklists
    lines.push(`### Checklist for Milestone ${sectionIndex}`);
    lines.push(`- [x] Initial architecture definition for #mobile/milestone-${sectionIndex}`);
    lines.push(`- [ ] Implement CodeMirror 6 live preview with [[Wikilink Target]]`);
    lines.push(`- [ ] Test French accents: élève, naïve, café, cœur`);
    lines.push(`- [ ] Test Arabic input: مرحباً بك في دافنشي`);
    lines.push(`- [ ] Verify visualViewport keyboard offset handling`);
    lines.push("");

    // Add a table every 5 sections
    if (sectionIndex % 5 === 0 && currentLine + 10 < lineCount) {
      lines.push("| Component | Status | Target | Tag |");
      lines.push("|---|---|---|---|");
      lines.push("| Parser | Active | [[Core]] | #parser |");
      lines.push("| LivePreview | Testing | [[Editor]] | #editor |");
      lines.push("| Sync | Verified | [[Storage]] | #sync |");
      lines.push("");
    }

    // Add code blocks
    lines.push("```ts");
    lines.push(`const configSection${sectionIndex} = { id: ${sectionIndex}, active: true };`);
    lines.push("```");
    lines.push("");

    sectionIndex += 1;
    currentLine = lines.length;
  }

  // Trim or pad to exact line count
  if (lines.length > lineCount) {
    return lines.slice(0, lineCount).join("\n");
  }

  while (lines.length < lineCount) {
    lines.push(`- [ ] Additional checklist item line ${lines.length + 1} with #tag`);
  }

  return lines.join("\n");
}

export const NOTE_200_LINES = generateTestNote(200);
export const NOTE_2000_LINES = generateTestNote(2000);
export const NOTE_10000_LINES = generateTestNote(10000);
