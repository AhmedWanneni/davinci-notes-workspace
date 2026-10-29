import { createNoteInVault } from "./createNoteInVault";
import { saveRecordedAudioToVault } from "../adapters/transcriptionClient";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { DEFAULT_MEETINGS_FOLDER } from "../components/ListeningView/listeningConstants";
import type {
  TranscriptSegmentItem,
  SuggestedLinkItem,
} from "../components/ListeningView/listeningTypes";

export interface MeetingNoteParams {
  title: string;
  startedAt: number;
  durationMs: number;
  segments: TranscriptSegmentItem[];
  suggestedLinks?: SuggestedLinkItem[];
  summary?: string;
  actionItems?: string[];
  attendees?: string[];
  folder?: string;
  audioRelPath?: string;
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatOffset(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function renderMeetingMarkdown(params: MeetingNoteParams): string {
  const startDate = new Date(params.startedAt || Date.now());
  const dateStr = startDate.toISOString().split("T")[0];
  const timeStr = formatTime(startDate);
  const durationSec = Math.round(params.durationMs / 1000);

  const frontmatter = [
    "---",
    `title: "${params.title.replace(/"/g, '\\"')}"`,
    `date: ${dateStr}`,
    `time: "${timeStr}"`,
    "tags:",
    "  - meeting",
    `duration_seconds: ${durationSec}`,
    ...(params.attendees && params.attendees.length > 0
      ? [
          "attendees:",
          ...params.attendees.map((a) => `  - "${a.replace(/"/g, '\\"')}"`),
        ]
      : []),
    "---",
  ].join("\n");

  const acceptedLinks = (params.suggestedLinks ?? []).filter(
    (l) => l.accepted !== false,
  );

  const sections: string[] = [
    frontmatter,
    "",
    `# ${params.title}`,
    "",
    "## Summary",
    params.summary && params.summary.trim()
      ? params.summary.trim()
      : "*No summary generated.*",
    "",
    "## Action Items",
    params.actionItems && params.actionItems.length > 0
      ? params.actionItems.map((item) => `- [ ] ${item}`).join("\n")
      : "- [ ] Review meeting notes",
    "",
  ];

  if (acceptedLinks.length > 0) {
    sections.push("## Related Notes");
    for (const link of acceptedLinks) {
      sections.push(`- [[${link.title}]] — ${link.reason}`);
    }
    sections.push("");
  }

  if (params.audioRelPath) {
    const audioFileName =
      params.audioRelPath.split(/[/\\]/).pop() ?? params.audioRelPath;
    sections.push("## Audio Recording");
    sections.push(`![[${audioFileName}]]`);
    sections.push("");
  }

  sections.push("## Transcript");
  if (params.segments.length > 0) {
    for (const seg of params.segments) {
      const speaker =
        seg.speaker === "me"
          ? "Me"
          : seg.speaker === "meeting"
            ? "Meeting"
            : "System";
      sections.push(`### ${formatOffset(seg.startMs)} — ${speaker}`);
      sections.push(seg.text);
      sections.push("");
    }
  } else {
    sections.push("*No transcript recorded.*");
  }

  return sections.join("\n");
}

export async function saveMeetingNoteToVault(
  params: MeetingNoteParams,
  existingPaths: string[] = [],
  tempWavPath?: string,
): Promise<string> {
  const folder = params.folder ?? DEFAULT_MEETINGS_FOLDER;
  const startDate = new Date(params.startedAt || Date.now());
  const dateStr = startDate.toISOString().split("T")[0];
  const cleanTitle =
    params.title.replace(/[\\/:*?"<>|]/g, " ").trim() || "Untitled Meeting";

  if (tempWavPath) {
    const store = useWorkspaceStore.getState();
    const attachmentFolder =
      store.attachmentSettings?.specifiedFolder?.trim() || "attachments";
    const audioFileName = `${dateStr} - ${cleanTitle}.wav`;
    let audioCandidate = `${attachmentFolder}/${audioFileName}`;
    let audioCounter = 1;
    while (existingPaths.includes(audioCandidate)) {
      audioCandidate = `${attachmentFolder}/${dateStr} - ${cleanTitle} (${audioCounter}).wav`;
      audioCounter++;
    }
    try {
      await saveRecordedAudioToVault(tempWavPath, audioCandidate);
      params.audioRelPath = audioCandidate;
      if (!store.allNotePaths.includes(audioCandidate)) {
        store.updateAllPaths([...store.allNotePaths, audioCandidate]);
      }
    } catch (err) {
      console.error("Failed to copy recorded audio to vault:", err);
    }
  }

  const basePath = `${folder}/${dateStr} - ${cleanTitle}.md`;
  let candidatePath = basePath;
  let counter = 1;

  while (existingPaths.includes(candidatePath)) {
    candidatePath = `${folder}/${dateStr} - ${cleanTitle} (${counter}).md`;
    counter++;
  }

  const markdown = renderMeetingMarkdown(params);
  return await createNoteInVault(candidatePath, markdown);
}
