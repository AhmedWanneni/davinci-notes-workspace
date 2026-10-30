import { describe, expect, it } from "vitest";
import {
  applyShortcutTemplate,
  DEFAULT_STARTER_SHORTCUTS,
  parseShortcuts,
  serializeShortcuts,
} from "./shortcutsEngine.js";

describe("shortcutsEngine", () => {
  it("returns default starter shortcuts on missing or invalid JSON", () => {
    expect(parseShortcuts(null).shortcuts).toHaveLength(DEFAULT_STARTER_SHORTCUTS.length);
    expect(parseShortcuts("").shortcuts).toHaveLength(DEFAULT_STARTER_SHORTCUTS.length);
    expect(parseShortcuts("corrupt json").shortcuts).toHaveLength(DEFAULT_STARTER_SHORTCUTS.length);
  });

  it("serializes and parses custom shortcuts", () => {
    const custom = {
      version: 1,
      shortcuts: [
        {
          id: "custom-1",
          title: "Custom Action",
          prompt: "Do something in {folder}",
        },
      ],
    };
    const json = serializeShortcuts(custom);
    const parsed = parseShortcuts(json);
    expect(parsed.shortcuts).toHaveLength(1);
    expect(parsed.shortcuts[0].id).toBe("custom-1");
  });

  it("substitutes template variables", () => {
    const prompt = "Summarize note '{activeNote}' and put into '{folder}'. Today is {today}.";
    const resolved = applyShortcutTemplate(prompt, {
      activeNote: "Projects/Q4.md",
      folder: "Summaries",
      today: "2026-10-25",
    });
    expect(resolved).toBe("Summarize note 'Projects/Q4.md' and put into 'Summaries'. Today is 2026-10-25.");
  });
});
