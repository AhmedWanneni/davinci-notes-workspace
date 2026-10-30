export function isConversationalMeta(text: string): boolean {
  if (!text) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes("staged-for-approval") ||
    lower.includes("staged for approval") ||
    lower.includes("pending approval") ||
    lower.includes("confirm or modify") ||
    lower.includes("staged for review") ||
    lower.includes("staged for your confirmation") ||
    lower.includes("please provide") ||
    lower.includes("what are the") ||
    lower.includes("what books") ||
    lower.includes("i'll need to know") ||
    lower.includes("could you provide") ||
    lower.includes("can you provide") ||
    lower.includes("do you want me to") ||
    lower.includes("would you like me to") ||
    lower.includes("to proceed, i'll need")
  );
}
