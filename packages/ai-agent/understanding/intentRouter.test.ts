import { describe, it, expect, vi } from "vitest";
import { classifyIntentFast, routeIntent } from "./intentRouter.js";

describe("intentRouter", () => {
  describe("classifyIntentFast", () => {
    it("classifies create_note requests with zero model calls", () => {
      expect(classifyIntentFast("create a note named meeting")).toBe("create_note");
      expect(classifyIntentFast("make a new kanban board")).toBe("create_note");
      expect(classifyIntentFast("new file groceries.md")).toBe("create_note");
      expect(classifyIntentFast("create folder Projects")).toBe("create_note");
    });

    it("classifies read_note requests", () => {
      expect(classifyIntentFast("read note Work.md")).toBe("read_note");
      expect(classifyIntentFast("open note ideas")).toBe("read_note");
      expect(classifyIntentFast("show me note Summary.md")).toBe("read_note");
    });

    it("classifies edit_note requests", () => {
      expect(classifyIntentFast("edit note recipes.md and add butter")).toBe("edit_note");
      expect(classifyIntentFast("append to note daily.md")).toBe("edit_note");
      expect(classifyIntentFast("update note status to done")).toBe("edit_note");
    });

    it("classifies organize and move requests", () => {
      expect(classifyIntentFast("move note old.md to Archive/")).toBe("organize");
      expect(classifyIntentFast("organize my notes by category")).toBe("organize");
      expect(classifyIntentFast("rename note drafts to final")).toBe("organize");
    });

    it("classifies search_vault requests", () => {
      expect(classifyIntentFast("search for machine learning in notes")).toBe("search_vault");
      expect(classifyIntentFast("find where I wrote about vacation")).toBe("search_vault");
      expect(classifyIntentFast("where is my passport info?")).toBe("search_vault");
    });

    it("classifies greetings as chat", () => {
      expect(classifyIntentFast("hello!")).toBe("chat");
      expect(classifyIntentFast("hi")).toBe("chat");
      expect(classifyIntentFast("who are you?")).toBe("chat");
    });

    it("returns null for ambiguous requests needing model classification", () => {
      expect(classifyIntentFast("tell me something interesting about Aristotle")).toBeNull();
    });
  });

  describe("routeIntent", () => {
    it("uses fast regex when matched without calling model", async () => {
      const mockModel = vi.fn();
      const intent = await routeIntent("create a note for books", mockModel);
      expect(intent).toBe("create_note");
      expect(mockModel).not.toHaveBeenCalled();
    });

    it("calls model when fast regex returns null", async () => {
      const mockModel = vi.fn().mockResolvedValue("search_vault");
      const intent = await routeIntent("compare Aristotle and Plato", mockModel);
      expect(mockModel).toHaveBeenCalledTimes(1);
      expect(intent).toBe("search_vault");
    });

    it("falls back to chat when model throws or returns invalid intent", async () => {
      const mockModel = vi.fn().mockRejectedValue(new Error("Timeout"));
      const intent = await routeIntent("some strange input", mockModel);
      expect(intent).toBe("chat");
    });
  });
});
