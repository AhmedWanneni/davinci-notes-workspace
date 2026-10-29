import { describe, it, expect } from "vitest";
import { shouldClarifyRequest } from "./clarificationEngine.js";

describe("clarificationEngine", () => {
  it("triggers clarification for vague targets with non-empty ambiguities", () => {
    const res = shouldClarifyRequest({
      goal: "that note about the thing from last week",
      intent: "read_note",
      target: null,
      constraints: [],
      ambiguities: ["Unspecified note title", "Vague target reference"],
    });

    expect(res.needsClarification).toBe(true);
    expect(res.question).toContain("Could you specify which note you are referring to?");
  });

  it("triggers clarification when target is null for read_note even if ambiguities array is empty", () => {
    const res = shouldClarifyRequest({
      goal: "read a note",
      intent: "read_note",
      target: null,
      constraints: [],
      ambiguities: [],
    });

    expect(res.needsClarification).toBe(true);
    expect(res.question).toBe("Which note would you like me to read? Please provide the note title or path.");
  });

  it("does not trigger clarification for unambiguous requests with clear targets", () => {
    const res = shouldClarifyRequest({
      goal: "read note recipes.md",
      intent: "read_note",
      target: "recipes.md",
      constraints: [],
      ambiguities: [],
    });

    expect(res.needsClarification).toBe(false);
    expect(res.question).toBeUndefined();
  });

  it("does not trigger clarification for chat requests without target", () => {
    const res = shouldClarifyRequest({
      goal: "hello how are you",
      intent: "chat",
      target: null,
      constraints: [],
      ambiguities: [],
    });

    expect(res.needsClarification).toBe(false);
  });
});
