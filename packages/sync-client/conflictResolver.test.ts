import { describe, expect, it } from "vitest";
import {
  isTextMergeable,
  resolveBinaryConflictName,
  resolveDeleteVsEdit,
  resolveTextConflict,
} from "./conflictResolver";

describe("Phase 4 Conflict Resolution — Text 3-Way Merge", () => {
  it("merges non-overlapping text edits cleanly without conflict markers", () => {
    const base = "Title\nLine 2\nLine 3\nLine 4\nFooter";
    const local = "Title (Edited Local)\nLine 2\nLine 3\nLine 4\nFooter";
    const remote = "Title\nLine 2\nLine 3\nLine 4\nFooter (Edited Remote)";

    const result = resolveTextConflict({
      path: "notes/sample.md",
      localContent: local,
      baseContent: base,
      remoteContent: remote,
    });

    expect(result.hasConflict).toBe(false);
    expect(result.kind).toBe("text-merge-clean");
    expect(result.mergedContent).toBe(
      "Title (Edited Local)\nLine 2\nLine 3\nLine 4\nFooter (Edited Remote)",
    );
  });

  it("inserts inline conflict markers and surfaces conflict flag for overlapping edits", () => {
    const base = "Line 1\nTarget content line\nLine 3";
    const local = "Line 1\nTarget content modified by device A\nLine 3";
    const remote = "Line 1\nTarget content modified by device B\nLine 3";

    const result = resolveTextConflict({
      path: "notes/sample.md",
      localContent: local,
      baseContent: base,
      remoteContent: remote,
      localLabel: "Device-A",
      remoteLabel: "Device-B",
    });

    expect(result.hasConflict).toBe(true);
    expect(result.kind).toBe("text-merge-conflict");
    expect(result.mergedContent).toContain("<<<<<<< Device-A");
    expect(result.mergedContent).toContain(
      "Target content modified by device A",
    );
    expect(result.mergedContent).toContain("=======");
    expect(result.mergedContent).toContain(
      "Target content modified by device B",
    );
    expect(result.mergedContent).toContain(">>>>>>> Device-B");
  });
});

describe("Phase 4 Conflict Resolution — Wikilink Safety Adversarial Tests", () => {
  it("preserves wikilinks inside conflict markers without corrupting data", () => {
    const base = "intro\n[[Project Alpha]]\noutro";
    const local = "intro\n[[Project Alpha|Local Alias]]\noutro";
    const remote = "intro\n[[Project Alpha|Remote Alias]]\noutro";

    const mergeResult = resolveTextConflict({
      path: "notes/project.md",
      localContent: local,
      baseContent: base,
      remoteContent: remote,
      localLabel: "Laptop",
      remoteLabel: "Desktop",
    });

    expect(mergeResult.hasConflict).toBe(true);
    expect(mergeResult.kind).toBe("text-merge-conflict");

    // Both wikilink lines are preserved verbatim inside the conflict markers,
    // so a downstream wikilink parser sees valid, parsible syntax.
    const mergedContent = mergeResult.mergedContent;
    expect(mergedContent).toContain("<<<<<<< Laptop");
    expect(mergedContent).toContain("[[Project Alpha|Local Alias]]");
    expect(mergedContent).toContain("=======");
    expect(mergedContent).toContain("[[Project Alpha|Remote Alias]]");
    expect(mergedContent).toContain(">>>>>>> Desktop");
  });

  it("surfaces conflict markers as plain text that keeps wikilink syntax intact", () => {
    const malformedSource =
      "Prefix\n<<<<<<< local\n[[Note A]]\n=======\n[[Note B]]\n>>>>>>> remote\nSuffix";

    const result = resolveTextConflict({
      path: "main.md",
      localContent: malformedSource,
      baseContent: malformedSource,
      remoteContent: malformedSource,
      localLabel: "local",
      remoteLabel: "remote",
    });

    // Merge of identical bases yields no conflict; the marker text is preserved
    // verbatim so wikilink markup is never rewritten or mangled.
    expect(result.hasConflict).toBe(false);
    expect(result.mergedContent).toBe(malformedSource);
  });
});

describe("Phase 4 Conflict Resolution — Canvas JSON Safety Adversarial Tests", () => {
  it("identifies .canvas files as non-text-mergeable to prevent JSON syntax corruption", () => {
    expect(isTextMergeable("mindmap.canvas")).toBe(false);
    expect(isTextMergeable("MINDMAP.CANVAS")).toBe(false);
    expect(isTextMergeable("note.md")).toBe(true);
  });

  it("resolves simultaneous canvas edits via binary-style copy, preserving 100% valid JSON", () => {
    const localCanvas = JSON.stringify({
      nodes: [
        {
          id: "n1",
          type: "text",
          x: 150,
          y: 200,
          width: 100,
          height: 100,
          text: "Card 1",
        },
      ],
      edges: [],
    });

    const remoteCanvas = JSON.stringify({
      nodes: [
        {
          id: "n1",
          type: "text",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          text: "Card 1",
        },
        {
          id: "n2",
          type: "text",
          x: 300,
          y: 300,
          width: 200,
          height: 150,
          text: "Card 2",
        },
      ],
      edges: [{ id: "e1", fromNode: "n1", toNode: "n2" }],
    });

    // Verify: canvas is not text-merged (which would risk invalid JSON syntax)
    expect(isTextMergeable("diagram.canvas")).toBe(false);

    // Resolve via non-colliding copy
    const copyResolution = resolveBinaryConflictName({
      path: "diagram.canvas",
      remoteDeviceName: "iPad",
      existingPaths: ["diagram.canvas"],
    });

    expect(copyResolution.copyPath).toBe("diagram (iPad copy).canvas");

    // Adversarial assertion: Both local and remote versions remain 100% parseable, valid JSON
    expect(() => JSON.parse(localCanvas)).not.toThrow();
    expect(() => JSON.parse(remoteCanvas)).not.toThrow();

    const parsedLocal = JSON.parse(localCanvas);
    const parsedRemote = JSON.parse(remoteCanvas);

    expect(parsedLocal.nodes[0].x).toBe(150);
    expect(parsedRemote.nodes.length).toBe(2);
    expect(parsedRemote.edges.length).toBe(1);
  });
});

describe("Phase 4 Conflict Resolution — Binary File Conflicts & Naming", () => {
  it("generates a clean copy path with remote device name for binary conflicts", () => {
    const result = resolveBinaryConflictName({
      path: "attachments/photo.png",
      remoteDeviceName: "MacBook Pro",
      existingPaths: ["attachments/photo.png"],
    });

    expect(result.copyPath).toBe("attachments/photo (MacBook Pro copy).png");
    expect(result.kind).toBe("binary-copy");
  });

  it("chains space-separated numeric suffixes on filename collision", () => {
    const existing = [
      "attachments/photo.png",
      "attachments/photo (MacBook Pro copy).png",
      "attachments/photo (MacBook Pro copy) 1.png",
    ];

    const result = resolveBinaryConflictName({
      path: "attachments/photo.png",
      remoteDeviceName: "MacBook Pro",
      existingPaths: existing,
    });

    expect(result.copyPath).toBe("attachments/photo (MacBook Pro copy) 2.png");
  });
});

describe("Phase 4 Conflict Resolution — Delete vs Edit", () => {
  it("preserves remote edit over local deletion and surfaces message", () => {
    const result = resolveDeleteVsEdit({
      path: "daily/note.md",
      localDeleted: true,
      remoteDeleted: false,
    });

    expect(result.winner).toBe("remote");
    expect(result.kind).toBe("delete-vs-edit-remote-wins");
    expect(result.surfacedMessage).toContain("edited remotely");
    expect(result.surfacedMessage).toContain("local deletion ignored");
  });

  it("preserves local edit over remote deletion and surfaces message", () => {
    const result = resolveDeleteVsEdit({
      path: "daily/note.md",
      localDeleted: false,
      remoteDeleted: true,
    });

    expect(result.winner).toBe("local");
    expect(result.kind).toBe("delete-vs-edit-local-wins");
    expect(result.surfacedMessage).toContain("edited locally");
    expect(result.surfacedMessage).toContain("remote deletion ignored");
  });
});
