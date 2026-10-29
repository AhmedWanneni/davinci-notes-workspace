// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { embedAudioExtension } from "./embedAudioExtension";

describe("embedAudioExtension", () => {
  it("decorates audio wikilinks and mounts player widget with rerun action", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const doc =
      "Here is the meeting audio:\n![[meeting-sync.wav]]\nEnd of note.";

    const state = EditorState.create({
      doc,
      extensions: [
        embedAudioExtension({
          notePaths: ["Meetings/meeting-sync.wav"],
          resolveMediaUrl: (path) => `asset://localhost/${path}`,
        }),
      ],
    });

    const view = new EditorView({ state });
    const widgetEl = view.dom.querySelector(
      ".cm-file-audio-embed",
    ) as HTMLElement;
    expect(widgetEl).not.toBeNull();
    expect(widgetEl.getAttribute("data-audio-path")).toContain(
      "meeting-sync.wav",
    );

    const player = widgetEl.querySelector("audio") as HTMLAudioElement;
    expect(player).not.toBeNull();
    expect(player.src).toContain("meeting-sync.wav");

    const rerunBtn = widgetEl.querySelector(
      ".cm-file-audio-embed__rerun-btn",
    ) as HTMLButtonElement;
    expect(rerunBtn).not.toBeNull();

    rerunBtn.click();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "davinci:re-run-audio-transcription",
      }),
    );

    view.destroy();
  });
});
