import { describe, expect, it, vi } from "vitest";
import { PluginEditorRpcHost } from "./PluginEditorRpcHost";

function editorFixture() {
  let content = "hello";
  let selection = { from: 5, to: 5 };
  const listeners = new Set<() => void>();
  return {
    editor: {
      getContent: () => content,
      setContent: (value: string) => { content = value; listeners.forEach((listener) => listener()); },
      getSelection: () => selection,
      setSelection: (value: typeof selection) => { selection = value; listeners.forEach((listener) => listener()); },
      insertText: (value: string) => { content += value; listeners.forEach((listener) => listener()); },
      onChange: (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); },
    },
    change: () => listeners.forEach((listener) => listener()),
  };
}

describe("PluginEditorRpcHost", () => {
  it("returns snapshots and applies version-checked editor mutations", async () => {
    const notify = vi.fn(async () => {});
    const fixture = editorFixture();
    const host = new PluginEditorRpcHost(notify);
    host.setEditor(fixture.editor);

    const before = await host.request("editor.getContent", { id: "fixture" });
    expect(before).toMatchObject({ content: "hello", selection: { from: 5, to: 5 } });
    const after = await host.request("editor.setContent", { id: "fixture", content: "changed", expectedVersion: (before as { version: number }).version });
    expect(after).toMatchObject({ content: "changed" });
    host.dispose();
  });

  it("coalesces rapid editor changes into one 100ms notification", async () => {
    vi.useFakeTimers();
    const notify = vi.fn(async () => {});
    const fixture = editorFixture();
    const host = new PluginEditorRpcHost(notify);
    host.setEditor(fixture.editor);
    await host.request("editor.subscribe", { id: "fixture", subscriptionId: "sub-1" });
    fixture.change();
    fixture.change();
    fixture.change();

    await vi.advanceTimersByTimeAsync(99);
    expect(notify).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith("editor.changed", expect.objectContaining({ id: "fixture", subscriptionId: "sub-1" }));
    host.dispose();
    vi.useRealTimers();
  });
});
