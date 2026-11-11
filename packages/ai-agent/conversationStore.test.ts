import { describe, expect, it } from "vitest";
import {
  createEmptyConversationsData,
  parseConversationsData,
  serializeConversationsData,
  addOrUpdateConversation,
  deleteConversation,
  createProject,
  deleteProject,
  moveConversationToProject,
  renameProject,
  addProjectSource,
  removeProjectSource,
  setProjectInstructions,
  addOrUpdateLibraryItem,
  deleteLibraryItem,
} from "./conversationStore";
import type { AgentConversation } from "./conversationTypes";

describe("conversationStore", () => {
  it("initializes empty data with General project", () => {
    const empty = createEmptyConversationsData();
    expect(empty.version).toBe(1);
    expect(empty.projects.length).toBe(1);
    expect(empty.projects[0].name).toBe("General");
    expect(empty.conversations).toEqual([]);
  });

  it("safely parses malformed JSON and serializes valid data", () => {
    const fallback = parseConversationsData("invalid json");
    expect(fallback.projects[0].name).toBe("General");

    const serialized = serializeConversationsData(fallback);
    const reParsed = parseConversationsData(serialized);
    expect(reParsed.projects[0].name).toBe("General");
  });

  it("adds and updates conversations", () => {
    let data = createEmptyConversationsData();
    const conv1: AgentConversation = {
      id: "c1",
      title: "Finance Review",
      projectId: "proj_general",
      createdAt: 1000,
      updatedAt: 1000,
      messages: [
        { id: "m1", role: "user", content: "Review budget", timestamp: 1000 },
      ],
    };

    data = addOrUpdateConversation(data, conv1);
    expect(data.conversations.length).toBe(1);
    expect(data.activeConversationId).toBe("c1");

    const updated = { ...conv1, title: "Finance Review 2026" };
    data = addOrUpdateConversation(data, updated);
    expect(data.conversations.length).toBe(1);
    expect(data.conversations[0].title).toBe("Finance Review 2026");
  });

  it("deletes a conversation and adjusts active ID", () => {
    let data = createEmptyConversationsData();
    const c1: AgentConversation = {
      id: "c1",
      title: "C1",
      createdAt: 1,
      updatedAt: 1,
      messages: [],
    };
    const c2: AgentConversation = {
      id: "c2",
      title: "C2",
      createdAt: 2,
      updatedAt: 2,
      messages: [],
    };
    data = addOrUpdateConversation(data, c1);
    data = addOrUpdateConversation(data, c2);

    expect(data.activeConversationId).toBe("c2");
    data = deleteConversation(data, "c2");
    expect(data.conversations.length).toBe(1);
    expect(data.activeConversationId).toBe("c1");
  });

  it("creates, moves, and deletes projects", () => {
    let data = createEmptyConversationsData();
    const { data: withProj, project } = createProject(data, "Work");
    data = withProj;
    expect(data.projects.some((p) => p.name === "Work")).toBe(true);

    const c1: AgentConversation = {
      id: "c1",
      title: "C1",
      createdAt: 1,
      updatedAt: 1,
      messages: [],
    };
    data = addOrUpdateConversation(data, c1);
    data = moveConversationToProject(data, "c1", project.id);
    expect(data.conversations[0].projectId).toBe(project.id);

    data = deleteProject(data, project.id);
    expect(data.projects.some((p) => p.id === project.id)).toBe(false);
    expect(data.conversations[0].projectId).toBe(null);
  });

  it("renames projects and manages project sources", () => {
    let data = createEmptyConversationsData();
    const { data: withProj, project } = createProject(data, "Gym");
    data = withProj;

    data = renameProject(data, project.id, "Fitness & Gym");
    expect(data.projects.find((p) => p.id === project.id)?.name).toBe(
      "Fitness & Gym",
    );

    data = addProjectSource(data, project.id, "Workouts/Routine.md");
    data = addProjectSource(data, project.id, "Nutrition/Diet.md");
    expect(data.projects.find((p) => p.id === project.id)?.sources).toEqual([
      "Workouts/Routine.md",
      "Nutrition/Diet.md",
    ]);

    // idempotent add
    data = addProjectSource(data, project.id, "Nutrition/Diet.md");
    expect(
      data.projects.find((p) => p.id === project.id)?.sources?.length,
    ).toBe(2);

    data = removeProjectSource(data, project.id, "Workouts/Routine.md");
    expect(data.projects.find((p) => p.id === project.id)?.sources).toEqual([
      "Nutrition/Diet.md",
    ]);
  });

  it("strictly isolates project sources and instructions between projects", () => {
    let data = createEmptyConversationsData();
    const { data: d1, project: projA } = createProject(data, "Project A");
    const { data: d2, project: projB } = createProject(d1, "Project B");
    data = d2;

    data = addProjectSource(data, projA.id, "Notes/SecretA.md");
    data = setProjectInstructions(
      data,
      projA.id,
      "Always format in concise markdown",
    );

    const projectA = data.projects.find((p) => p.id === projA.id);
    const projectB = data.projects.find((p) => p.id === projB.id);

    expect(projectA?.sources).toEqual(["Notes/SecretA.md"]);
    expect(projectA?.instructions).toBe("Always format in concise markdown");

    // Project B must have zero leakage of Project A's sources or instructions
    expect(projectB?.sources ?? []).not.toContain("Notes/SecretA.md");
    expect(projectB?.instructions).toBeUndefined();

    // Removing source from Project A does not alter Project B
    data = removeProjectSource(data, projA.id, "Notes/SecretA.md");
    expect(data.projects.find((p) => p.id === projA.id)?.sources).toEqual([]);
    expect(data.projects.find((p) => p.id === projB.id)?.sources ?? []).toEqual(
      [],
    );
  });

  it("adds, updates, and deletes library items", () => {
    let data = createEmptyConversationsData();
    expect(data.libraryItems).toEqual([]);

    data = addOrUpdateLibraryItem(data, {
      id: "lib-1",
      type: "skill",
      projectId: "proj-1",
      title: "Meeting Summarizer",
      content: "Summarize transcript into actions",
      createdAt: 1000,
      updatedAt: 1000,
    });
    expect(data.libraryItems?.length).toBe(1);
    expect(data.libraryItems?.[0].title).toBe("Meeting Summarizer");

    data = addOrUpdateLibraryItem(data, {
      id: "lib-1",
      type: "skill",
      projectId: "proj-1",
      title: "Executive Summarizer",
      content: "Summarize transcript for executives",
      createdAt: 1000,
      updatedAt: 2000,
    });
    expect(data.libraryItems?.length).toBe(1);
    expect(data.libraryItems?.[0].title).toBe("Executive Summarizer");

    data = deleteLibraryItem(data, "lib-1");
    expect(data.libraryItems?.length).toBe(0);
  });
});
