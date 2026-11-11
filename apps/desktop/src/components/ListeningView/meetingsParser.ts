export interface ParsedMeetingItem {
  path: string;
  title: string;
  date: string;
  time?: string;
  durationSeconds: number;
  summary: string;
  actionItems: string[];
  answers: Array<{ question: string; answer: string }>;
  questions: string[];
  relatedNotes: Array<{ title: string; reason?: string }>;
  audioFileName?: string | null;
  transcript: Array<{ offset: string; speaker: string; text: string }>;
}

export function parseMeetingMarkdown(path: string, rawContent: string): ParsedMeetingItem {
  const result: ParsedMeetingItem = {
    path,
    title: path.split("/").pop()?.replace(/\.md$/i, "") ?? "Untitled Meeting",
    date: "",
    durationSeconds: 0,
    summary: "",
    actionItems: [],
    answers: [],
    questions: [],
    relatedNotes: [],
    audioFileName: null,
    transcript: [],
  };

  if (!rawContent) return result;

  // Extract YAML frontmatter
  const frontmatterMatch = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatterMatch) {
    const fm = frontmatterMatch[1];
    const titleMatch = fm.match(/^title:\s*"?(.*?)"?$/m);
    if (titleMatch) result.title = titleMatch[1].trim();

    const dateMatch = fm.match(/^date:\s*([^\r\n]+)/m);
    if (dateMatch) result.date = dateMatch[1].trim();

    const timeMatch = fm.match(/^time:\s*"?(.*?)"?$/m);
    if (timeMatch) result.time = timeMatch[1].trim();

    const durMatch = fm.match(/^duration_seconds:\s*(\d+)/m);
    if (durMatch) result.durationSeconds = parseInt(durMatch[1], 10);
  }

  // Audio embed: ![[filename.wav]]
  const audioMatch = rawContent.match(/!\[\[(.*?\.(?:wav|mp3|m4a|ogg|aac))\]\]/i);
  if (audioMatch) {
    result.audioFileName = audioMatch[1].trim();
  }

  // Extract sections by splitting on ##
  const sections = rawContent.split(/\n(?=##\s+)/);
  for (const sec of sections) {
    const trimmed = sec.trim();
    if (trimmed.startsWith("## Summary")) {
      result.summary = trimmed.replace(/^## Summary\s*/i, "").trim();
    } else if (trimmed.startsWith("## Action Items")) {
      const lines = trimmed.replace(/^## Action Items\s*/i, "").split("\n");
      result.actionItems = lines
        .map((l) => l.replace(/^[-*]\s*(\[[ x]\])?\s*/i, "").trim())
        .filter((l) => l.length > 0 && l !== "Review meeting notes");
    } else if (trimmed.startsWith("## Q&A")) {
      const block = trimmed.replace(/^## Q&A\s*/i, "");
      const pairs = block.split(/\n(?=\*\*Q:)/);
      for (const p of pairs) {
        const qMatch = p.match(/\*\*Q:\s*([^*]+)\*\*/i);
        const aMatch = p.match(/A:\s*([^\n]+)/i);
        if (qMatch) {
          result.answers.push({
            question: qMatch[1].trim(),
            answer: aMatch ? aMatch[1].trim() : "",
          });
        }
      }
    } else if (trimmed.startsWith("## Suggested Follow-up Questions")) {
      const lines = trimmed.replace(/^## Suggested Follow-up Questions\s*/i, "").split("\n");
      result.questions = lines
        .map((l) => l.replace(/^[-*]\s*/, "").trim())
        .filter((l) => l.length > 0);
    } else if (trimmed.startsWith("## Related Notes")) {
      const lines = trimmed.replace(/^## Related Notes\s*/i, "").split("\n");
      for (const l of lines) {
        const linkMatch = l.match(/\[\[(.*?)\]\](?:\s*—\s*(.*))?/);
        if (linkMatch) {
          result.relatedNotes.push({
            title: linkMatch[1],
            reason: linkMatch[2]?.trim(),
          });
        }
      }
    } else if (trimmed.startsWith("## Transcript")) {
      const block = trimmed.replace(/^## Transcript\s*/i, "");
      const subBlocks = block.split(/\n(?=###\s+)/);
      for (const sb of subBlocks) {
        const headerMatch = sb.match(/^###\s+([0-9:]+)\s*—\s*(.*)/m);
        if (headerMatch) {
          const body = sb.replace(/^###[^\n]*\n?/, "").trim();
          result.transcript.push({
            offset: headerMatch[1],
            speaker: headerMatch[2].trim(),
            text: body,
          });
        }
      }
    }
  }

  return result;
}
