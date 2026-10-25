import { describe, it, expect } from "vitest";
import {
  validateAgentAction,
  isAllowedAction,
  isDestructiveAction,
} from "./actionValidator.js";

describe("actionValidator", () => {
  it("validates allowed actions with valid arguments", () => {
    const validCreate = validateAgentAction("create_note", {
      path: "Notes/Test.md",
      content: "# Hello",
    });
    expect(validCreate.success).toBe(true);
    if (validCreate.success) {
      expect(validCreate.data.name).toBe("create_note");
      expect(validCreate.data.isDestructive).toBe(false);
    }
  });

  it("identifies delete_note, edit_note, and move_note as destructive", () => {
    expect(isDestructiveAction("delete_note")).toBe(true);
    expect(isDestructiveAction("edit_note")).toBe(true);
    expect(isDestructiveAction("move_note")).toBe(true);
    expect(isDestructiveAction("create_note")).toBe(false);
    expect(isDestructiveAction("search_vault")).toBe(false);
    expect(isDestructiveAction("read_note")).toBe(false);
  });

  it("rejects unknown actions not in the allowed list", () => {
    const unknown = validateAgentAction("format_hard_drive", { target: "all" });
    expect(unknown.success).toBe(false);
    if (!unknown.success) {
      expect(unknown.error).toContain("is not in the allowed actions list");
    }
    expect(isAllowedAction("format_hard_drive")).toBe(false);
  });

  it("rejects malformed arguments for actions", () => {
    const missingPath = validateAgentAction("read_note", {});
    expect(missingPath.success).toBe(false);
    if (!missingPath.success) {
      expect(missingPath.error).toContain('requires a non-empty string "path"');
    }

    const missingContent = validateAgentAction("edit_note", {
      path: "Work.md",
    });
    expect(missingContent.success).toBe(false);
    if (!missingContent.success) {
      expect(missingContent.error).toContain('requires string "content"');
    }

    const missingQuery = validateAgentAction("search_vault", { query: "" });
    expect(missingQuery.success).toBe(false);
  });
});
