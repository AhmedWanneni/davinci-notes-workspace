import type { PromptAttachmentItem } from "./usePromptAttachments";

export function buildPromptWithAttachments(
  value: string,
  attachedItems: PromptAttachmentItem[],
): { attachmentsPrefix: string; finalPrompt: string } {
  const attachmentsPrefix = attachedItems
    .map((item) => {
      const label =
        item.kind === "skill"
          ? "Skill"
          : item.kind === "rule"
            ? "Rule"
            : "Attached File";
      return `[${label}: ${item.name}]\n${item.content}`;
    })
    .join("\n\n");

  const finalPrompt = [attachmentsPrefix, value.trim()]
    .filter(Boolean)
    .join("\n\n");

  return { attachmentsPrefix, finalPrompt };
}
