import { loadAISubsystem } from "../../ai/loadAISubsystem";
import type { AiSelectionActionKind } from "./EditorAiSelectionTypes";

export interface ExecuteAiSelectionOptions {
  selectedText: string;
  instruction: string;
  action: AiSelectionActionKind;
  noteTitle?: string;
}

export function buildAiSelectionSystemPrompt(
  action: AiSelectionActionKind,
): string {
  if (action === "explain") {
    return (
      "You are an expert knowledge assistant in a local-first markdown note-taking app. " +
      "Explain the selected text clearly and concisely. Format your response in clean markdown."
    );
  }

  return (
    "You are an expert editor in a local-first markdown note-taking app. " +
    "The user has highlighted a specific passage of text from their note and wants you to edit, amend, or transform it. " +
    "CRITICAL REQUIREMENT: Return ONLY the revised/generated replacement markdown text directly. " +
    "Do NOT include conversational chatter, preamble, greetings, or meta-commentary like 'Here is the revised text:'. " +
    "Preserve formatting (bold, links, lists, code) wherever appropriate."
  );
}

export function buildAiSelectionUserPrompt(
  selectedText: string,
  instruction: string,
  noteTitle?: string,
): string {
  const noteContext = noteTitle ? `Context (Note: "${noteTitle}")\n` : "";
  return `${noteContext}Selected text:
"""
${selectedText}
"""

Instruction:
${instruction}`;
}

export async function executeAiSelectionPrompt(
  options: ExecuteAiSelectionOptions,
): Promise<string> {
  const { selectedText, instruction, action, noteTitle } = options;
  if (!selectedText.trim()) {
    throw new Error("No text selected to edit.");
  }
  if (!instruction.trim()) {
    throw new Error("Please provide an instruction for the AI.");
  }

  const ai = await loadAISubsystem();
  const providerId = await ai.loadSelectedProvider();
  const provider = await ai.createConfiguredProvider(providerId);

  try {
    const systemPrompt = buildAiSelectionSystemPrompt(action);
    const userPrompt = buildAiSelectionUserPrompt(
      selectedText,
      instruction,
      noteTitle,
    );

    const result = await provider.complete({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const output = result.content?.trim();
    if (!output) {
      throw new Error("AI provider returned empty response.");
    }
    return output;
  } finally {
    if (provider.dispose) {
      await provider.dispose();
    }
  }
}
