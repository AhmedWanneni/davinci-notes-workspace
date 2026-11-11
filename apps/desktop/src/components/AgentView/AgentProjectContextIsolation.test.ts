import { describe, expect, it } from "vitest";
import { resolveExecutionPromptAndTools } from "./agentPromptResolver";
import type { AIProvider } from "@app/ai-api";
import type { VaultMutationBackend } from "@app/ai-agent";

describe("Project Context Strict Isolation", () => {
  const dummyProvider: AIProvider = {
    id: "gemini",
    name: "Gemini",
    model: "gemini-2.0-flash",
    complete: async () => ({
      model: "gemini-2.0-flash",
      content: "ok",
    }),
  };

  const createMockMutationBackend = (
    notes: Record<string, string>,
  ): VaultMutationBackend => ({
    readNote: async (path: string) => {
      if (notes[path]) return notes[path];
      throw new Error(`File not found: ${path}`);
    },
    writeNote: async () => {},
  });

  it("injects project sources and instructions into system prompt ONLY for that project", async () => {
    const mockBackend = createMockMutationBackend({
      "Work/Architecture.md": "# System Architecture\nUses Event-Driven CQRS.",
      "Work/Roadmap.md": "# Roadmap 2026\nQuarter 1 targets.",
      "Gym/Workout.md": "# Workout Plan\n5x5 Squats and Bench.",
    });

    // Execution under Project A ("Architecture Project")
    const projAResult = await resolveExecutionPromptAndTools({
      options: {
        projectName: "Architecture Project",
        projectInstructions: "Always provide Rust implementations",
        projectSources: ["Work/Architecture.md", "Work/Roadmap.md"],
      },
      structuredRequest: null,
      provider: dummyProvider,
      promptText: "How should we design the database?",
      vaultPath: "/notes",
      allNotePaths: [
        "Work/Architecture.md",
        "Work/Roadmap.md",
        "Gym/Workout.md",
      ],
      allFolderPaths: ["Work", "Gym"],
      mutationBackend: mockBackend,
    });

    expect(projAResult.systemPrompt).toContain(
      "## Project Instructions (Architecture Project)",
    );
    expect(projAResult.systemPrompt).toContain(
      "Always provide Rust implementations",
    );
    expect(projAResult.systemPrompt).toContain(
      "## Project Context Sources (Architecture Project)",
    );
    expect(projAResult.systemPrompt).toContain("Uses Event-Driven CQRS.");
    expect(projAResult.systemPrompt).toContain("Quarter 1 targets.");

    // Must NOT contain Gym context
    expect(projAResult.systemPrompt).not.toContain("Workout Plan");
    expect(projAResult.systemPrompt).not.toContain("5x5 Squats");
  });

  it("does not leak Project A context into Project B execution", async () => {
    const mockBackend = createMockMutationBackend({
      "Work/Secret.md": "CONFIDENTIAL_KEY_XYZ",
      "Gym/Routine.md": "Cardio 30 mins",
    });

    // Execution under Project B ("Fitness")
    const projBResult = await resolveExecutionPromptAndTools({
      options: {
        projectName: "Fitness",
        projectInstructions: "Count macros strictly",
        projectSources: ["Gym/Routine.md"],
      },
      structuredRequest: null,
      provider: dummyProvider,
      promptText: "What is my routine?",
      vaultPath: "/notes",
      allNotePaths: ["Work/Secret.md", "Gym/Routine.md"],
      allFolderPaths: ["Work", "Gym"],
      mutationBackend: mockBackend,
    });

    expect(projBResult.systemPrompt).toContain(
      "## Project Instructions (Fitness)",
    );
    expect(projBResult.systemPrompt).toContain("Count macros strictly");
    expect(projBResult.systemPrompt).toContain("Cardio 30 mins");

    // Zero leak of Project A's secret content or project source block
    expect(projBResult.systemPrompt).not.toContain("CONFIDENTIAL_KEY_XYZ");
    expect(projBResult.systemPrompt).not.toContain("### File: Work/Secret.md");
  });

  it("does not inject any project context during general unassociated chats", async () => {
    const mockBackend = createMockMutationBackend({
      "Notes/Daily.md": "General notes",
    });

    const generalResult = await resolveExecutionPromptAndTools({
      options: {
        projectName: undefined,
        projectInstructions: undefined,
        projectSources: undefined,
      },
      structuredRequest: null,
      provider: dummyProvider,
      promptText: "Hello assistant",
      vaultPath: "/notes",
      allNotePaths: ["Notes/Daily.md"],
      allFolderPaths: ["Notes"],
      mutationBackend: mockBackend,
    });

    expect(generalResult.systemPrompt).not.toContain("## Project Instructions");
    expect(generalResult.systemPrompt).not.toContain(
      "## Project Context Sources",
    );
  });
});
