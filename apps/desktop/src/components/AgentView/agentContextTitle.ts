/**
 * Derives a clean, concise, contextual title from the initial conversation prompt.
 */
export function deriveConversationContextTitle(rawPrompt: string): string {
  if (!rawPrompt || !rawPrompt.trim()) {
    return "New Chat";
  }

  // 1. Remove mentions (e.g. @Folder/Note.md or @file)
  let text = rawPrompt.replace(/@[^\s]+/g, " ");

  // 2. Remove slash commands (e.g. /model, /search, /fix)
  text = text.replace(/\/[a-zA-Z0-9_-]+/g, " ");

  // 3. Remove leading markdown formatting (#, *, -, >)
  text = text.replace(/^[#*>\-\s]+/, " ");

  // 4. Remove leading/trailing quotation marks and trim
  text = text.replace(/^["'`]+|["'`]+$/g, "").trim();

  // 5. If question prefix like "can you", "please", "could you", strip for cleaner title
  text = text.replace(
    /^(can you|could you|please|i want to|how to|how do i)\s+/i,
    "",
  );

  // 6. Split by first newline or sentence end (.!?)
  const firstSentence = text.split(/[\n.!?]/)[0]?.trim() || text;

  // 7. Capitalize first letter
  const cleaned =
    firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);

  if (!cleaned.trim()) {
    return "New Chat";
  }

  // 8. Cap at 42 chars nicely
  if (cleaned.length <= 42) {
    return cleaned;
  }

  const truncated = cleaned.slice(0, 42).trim();
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 20) {
    return `${truncated.slice(0, lastSpace)}...`;
  }
  return `${truncated}...`;
}
