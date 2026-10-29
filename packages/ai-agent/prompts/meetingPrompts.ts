export const MEETING_SYNTHESIS_SYSTEM_PROMPT = `You are a real-time meeting assistant. Your task is to analyze meeting transcript excerpts and produce concise, structured notes.

Guidelines:
1. Capture core discussions and decisions accurately.
2. Distinguish clearly between decided agreements and open discussions.
3. Keep summaries concise, factual, and neutral.
4. Extract concrete, actionable next steps as checkbox items.`;

export function createMeetingSynthesisPrompt(
  transcriptText: string,
  existingSummary?: string,
): string {
  return `${MEETING_SYNTHESIS_SYSTEM_PROMPT}

${existingSummary ? `Current Meeting Summary so far:\n${existingSummary}\n\n` : ""}Recent transcript excerpt:
"""
${transcriptText}
"""

Please provide an updated, concise summary of the meeting so far.`;
}

export function extractActionItemsPrompt(transcriptText: string): string {
  return `${MEETING_SYNTHESIS_SYSTEM_PROMPT}

From the following meeting transcript, extract all concrete commitments, tasks, and action items.
Format each item as a bullet point starting with "- [ ] ".
If no action items are discussed, output nothing.

Transcript:
"""
${transcriptText}
"""`;
}
