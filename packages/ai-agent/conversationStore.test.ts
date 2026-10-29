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
      messages: [{ id: "m1", role: "user", content: "Review budget", timestamp: 1000 }],
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
    const c1: AgentConversation = { id: "c1", title: "C1", createdAt: 1, updatedAt: 1, messages: [] };
    const c2: AgentConversation = { id: "c2", title: "C2", createdAt: 2, updatedAt: 2, messages: [] };
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

    const c1: AgentConversation = { id: "c1", title: "C1", createdAt: 1, updatedAt: 1, messages: [] };
    data = addOrUpdateConversation(data, c1);
    data = moveConversationToProject(data, "c1", project.id);
    expect(data.conversations[0].projectId).toBe(project.id);

    data = deleteProject(data, project.id);
    expect(data.projects.some((p) => p.id === project.id)).toBe(false);
    expect(data.conversations[0].projectId).toBe(null);
  });
});
