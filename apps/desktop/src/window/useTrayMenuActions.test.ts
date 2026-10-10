// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  listenMock,
  invokeMock,
  saveAllDirtyMock,
  openNoteMock,
  subscribeMock,
} = vi.hoisted(() => ({
  listenMock: vi.fn(),
  invokeMock: vi.fn(),
  saveAllDirtyMock: vi.fn(),
  openNoteMock: vi.fn(),
  subscribeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: unknown[]) => listenMock(...args),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("../state/useWorkspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({
      saveAllDirty: saveAllDirtyMock,
      openNote: openNoteMock,
      noteHistory: { paths: ["welcome.md"] },
      openNotes: ["welcome.md"],
      activeNotePath: "welcome.md",
      allNotePaths: ["welcome.md"],
    }),
    subscribe: (...args: unknown[]) => subscribeMock(...args),
  },
}));

import {
  CLEAN_QUIT_EVENT,
  TRAY_DAILY_NOTE_EVENT,
  TRAY_NEW_NOTE_EVENT,
  TRAY_OPEN_NOTE_EVENT,
  TRAY_OPEN_VAULT_EVENT,
  TRAY_QUIT_EVENT,
  WINDOW_HIDDEN_EVENT,
  useTrayMenuActions,
} from "./useTrayMenuActions";

describe("useTrayMenuActions", () => {
  type ListenerHandler = (event?: { payload?: unknown }) => void;
  let listeners: Map<string, ListenerHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    listeners = new Map();
    listenMock.mockImplementation(
      async (event: string, handler: ListenerHandler) => {
        listeners.set(event, handler);
        return () => undefined;
      },
    );
    saveAllDirtyMock.mockResolvedValue(undefined);
    invokeMock.mockResolvedValue(undefined);
    subscribeMock.mockReturnValue(() => undefined);
  });

  it("handles new note when vault is open, ignores when null", async () => {
    const createNewNote = vi.fn().mockResolvedValue("Untitled.md");
    const { unmount } = renderHook(() =>
      useTrayMenuActions({ vaultPath: "/vault", createNewNote }),
    );
    await act(async () => {
      await Promise.resolve();
    });

    listeners.get(TRAY_NEW_NOTE_EVENT)?.();
    expect(createNewNote).toHaveBeenCalledOnce();
    unmount();

    renderHook(() => useTrayMenuActions({ vaultPath: null, createNewNote }));
    await act(async () => {
      await Promise.resolve();
    });
    createNewNote.mockClear();
    listeners.get(TRAY_NEW_NOTE_EVENT)?.();
    expect(createNewNote).not.toHaveBeenCalled();
  });

  it("handles daily note and open vault tray actions", async () => {
    const onDailyNotes = vi.fn();
    const onOpenVault = vi.fn();
    renderHook(() =>
      useTrayMenuActions({
        vaultPath: "/vault",
        createNewNote: vi.fn(),
        onDailyNotes,
        onOpenVault,
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });

    listeners.get(TRAY_DAILY_NOTE_EVENT)?.();
    expect(onDailyNotes).toHaveBeenCalledOnce();

    listeners.get(TRAY_OPEN_VAULT_EVENT)?.();
    expect(onOpenVault).toHaveBeenCalledOnce();
  });

  it("opens note through workspace store on tray open note event", async () => {
    renderHook(() =>
      useTrayMenuActions({
        vaultPath: "/vault",
        createNewNote: vi.fn(),
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });

    listeners.get(TRAY_OPEN_NOTE_EVENT)?.({ payload: { path: "ideas.md" } });
    expect(openNoteMock).toHaveBeenCalledWith("ideas.md");
  });

  it("syncs debounced recent notes to native tray", () => {
    renderHook(() =>
      useTrayMenuActions({
        vaultPath: "/vault",
        createNewNote: vi.fn(),
      }),
    );

    expect(invokeMock).not.toHaveBeenCalledWith(
      "update_tray_recent_notes",
      expect.anything(),
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(invokeMock).toHaveBeenCalledWith("update_tray_recent_notes", {
      hasVault: true,
      recentNotes: [{ path: "welcome.md", title: "welcome" }],
    });
  });

  it("flushes dirty notes then exits on quit, flushes on hide without exiting", async () => {
    renderHook(() =>
      useTrayMenuActions({
        vaultPath: "/vault",
        createNewNote: vi.fn(),
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      listeners.get(WINDOW_HIDDEN_EVENT)?.();
      await Promise.resolve();
    });
    expect(saveAllDirtyMock).toHaveBeenCalledOnce();
    expect(invokeMock).not.toHaveBeenCalledWith("request_app_exit");

    saveAllDirtyMock.mockClear();
    await act(async () => {
      listeners.get(CLEAN_QUIT_EVENT)?.();
      await Promise.resolve();
    });
    expect(saveAllDirtyMock).toHaveBeenCalledOnce();
    expect(invokeMock).toHaveBeenCalledWith("request_app_exit");

    saveAllDirtyMock.mockClear();
    invokeMock.mockClear();
    await act(async () => {
      listeners.get(TRAY_QUIT_EVENT)?.();
      await Promise.resolve();
    });
    expect(saveAllDirtyMock).toHaveBeenCalledOnce();
    expect(invokeMock).toHaveBeenCalledWith("request_app_exit");
  });
});
