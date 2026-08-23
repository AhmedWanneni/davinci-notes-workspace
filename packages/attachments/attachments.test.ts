import { describe, expect, it } from "vitest";
import {
  DEFAULT_ATTACHMENT_SETTINGS,
  isAcceptedAttachmentName,
  resolveAttachmentFolder,
} from "./index";

describe("attachment formats", () => {
  it("accepts representative image, audio, video, and PDF names", () => {
    for (const name of ["cover.PNG", "sound.m4a", "clip.webm", "paper.pdf"]) {
      expect(isAcceptedAttachmentName(name)).toBe(true);
    }
  });

  it("rejects unlisted executable and archive formats", () => {
    expect(isAcceptedAttachmentName("run.exe")).toBe(false);
    expect(isAcceptedAttachmentName("archive.zip")).toBe(false);
  });
});

describe("resolveAttachmentFolder", () => {
  it("resolves vault root", () => {
    expect(resolveAttachmentFolder("notes/today.md", DEFAULT_ATTACHMENT_SETTINGS)).toBe("");
  });

  it("resolves a specified folder without checking its existence", () => {
    expect(resolveAttachmentFolder("today.md", {
      ...DEFAULT_ATTACHMENT_SETTINGS, locationMode: "specified-folder",
      specifiedFolder: "media/images",
    })).toBe("media/images");
  });

  it("resolves the containing folder for a nested note", () => {
    expect(resolveAttachmentFolder("projects/2026/plan.md", {
      ...DEFAULT_ATTACHMENT_SETTINGS, locationMode: "note-folder",
    })).toBe("projects/2026");
  });

  it("resolves a subfolder below the containing folder", () => {
    expect(resolveAttachmentFolder("projects/2026/plan.md", {
      ...DEFAULT_ATTACHMENT_SETTINGS, locationMode: "note-subfolder",
      noteSubfolder: "assets",
    })).toBe("projects/2026/assets");
  });

  it("falls back to vault-relative targets for an unsaved note", () => {
    expect(resolveAttachmentFolder(null, {
      ...DEFAULT_ATTACHMENT_SETTINGS, locationMode: "note-subfolder",
      noteSubfolder: "assets",
    })).toBe("assets");
  });

  it("normalizes separators and preserves an explicit absolute path", () => {
    expect(resolveAttachmentFolder("notes/today.md", {
      ...DEFAULT_ATTACHMENT_SETTINGS, locationMode: "specified-folder",
      specifiedFolder: "/Volumes/Vault/Media\\Images/",
    })).toBe("/Volumes/Vault/Media/Images");
  });
});
