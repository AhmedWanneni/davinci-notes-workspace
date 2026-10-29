import { isAcceptedAttachmentName } from "@app/attachments";
import {
  findWikilinkCandidates,
  parseWikilinkTarget,
} from "@app/indexer";
import { extractHeadingSection } from "./noteSectionExtraction";

export type EmbedResolution =
  | { type: "image" | "audio" | "video" | "pdf"; path: string }
  | { type: "note"; path: string; heading?: string }
  | { type: "ambiguous"; candidates: string[] }
  | { type: "heading-not-found"; path: string; heading: string }
  | { type: "unresolved" };

export interface EmbedLinkResolutionOptions {
  paths: readonly string[];
  noteContents?: Readonly<Record<string, string>>;
}

function targetKind(path: string): "image" | "audio" | "video" | "pdf" | "note" | undefined {
  if (/\.md$/i.test(path)) return "note";
  if (!isAcceptedAttachmentName(path)) return undefined;
  const extension = path.toLowerCase().split(".").pop();
  if (extension === "pdf") return "pdf";
  if (["mp3", "wav", "m4a", "ogg", "aac", "flac"].includes(extension ?? "")) return "audio";
  if (["mp4", "webm", "mov"].includes(extension ?? "")) return "video";
  return "image";
}

function hasHeading(content: string | undefined, heading: string): boolean {
  if (content === undefined) return false;
  return extractHeadingSection(content, heading).found;
}

export function resolveEmbedLink(
  syntax: string,
  options: EmbedLinkResolutionOptions,
): EmbedResolution {
  const match = /^!\[\[([^\]|]+?)(?:\|[^\]|]+?)?\]\]$/.exec(syntax.trim());
  if (!match) return { type: "unresolved" };

  const parts = parseWikilinkTarget(match[1]!);
  const candidates = findWikilinkCandidates(parts.noteTarget, options.paths);
  if (candidates.length === 0) return { type: "unresolved" };
  if (candidates.length > 1) return { type: "ambiguous", candidates };

  const path = candidates[0]!;
  const kind = targetKind(path);
  if (!kind) return { type: "unresolved" };
  if (kind !== "note") return { type: kind, path };
  if (!parts.heading) return { type: "note", path };
  if (!hasHeading(options.noteContents?.[path], parts.heading)) {
    return { type: "heading-not-found", path, heading: parts.heading };
  }
  return { type: "note", path, heading: parts.heading };
}
