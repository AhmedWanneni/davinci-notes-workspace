// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listenMock, invokeMock, saveAllDirtyMock } = vi.hoisted(() => ({
  listenMock: vi.fn(),
  invokeMock: vi.fn(),
  saveAllDirtyMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: unknown[]) => listenMock(...args),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("../state/useWorkspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({ saveAllDirty: saveAllDirtyMock }),
  },
}));

import {
  CLEAN_QUIT_EVENT,
  TRAY_NEW_NOTE_EVENT,
  TRAY_QUIT_EVENT,
  WINDOW_HIDDEN_EVENT,
  useTrayMenuActions,
} from "./useTrayMenuActions";

describe("useTrayMenuActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listenMock.mockResolvedValue(() => undefined);
    saveAllDirtyMock.mockResolvedValue(undefined);
    invokeMock.mockResolvedValue(undefined);
  });

  it("creates a note through the existing path when a vault is open", async () => {
    const createNewNote = vi.fn().mockResolvedValue("Untitled.md");
    const listeners = new Map<string, () => void>();
    listenMock.mockImplementation(
      async (event: string, handler: () => void) => {
        listeners.set(event, handler);
        return () => undefined;
      },
    );

    renderHook(() =>
      useTrayMenuActions({ vaultPath: "/vault", createNewNote }),
    );
    await act(async () => {
      await Promise.resolve();
    });

    listeners.get(TRAY_NEW_NOTE_EVENT)?.();
    expect(createNewNote).toHaveBeenCalledOnce();
  });

  it("does not create a note when no vault is open", async () => {
    const createNewNote = vi.fn();
    const listeners = new Map<string, () => void>();
    listenMock.mockImplementation(
      async (event: string, handler: () => void) => {
        listeners.set(event, handler);
        return () => undefined;
      },
    );

    renderHook(() => useTrayMenuActions({ vaultPath: null, createNewNote }));
    await act(async () => {
      await Promise.resolve();
    });

    listeners.get(TRAY_NEW_NOTE_EVENT)?.();
    expect(createNewNote).not.toHaveBeenCalled();
  });

  it("flushes dirty notes then requests a clean app exit on clean quit", async () => {
    const listeners = new Map<string, () => void>();
    listenMock.mockImplementation(
      async (event: string, handler: () => void) => {
        listeners.set(event, handler);
        return () => undefined;
      },
    );

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
      listeners.get(CLEAN_QUIT_EVENT)?.();
      await Promise.resolve();
    });

    expect(saveAllDirtyMock).toHaveBeenCalledOnce();
    expect(invokeMock).toHaveBeenCalledWith("request_app_exit");
  });

  it("flushes dirty notes then requests a clean app exit on tray quit", async () => {
    const listeners = new Map<string, () => void>();
    listenMock.mockImplementation(
      async (event: string, handler: () => void) => {
        listeners.set(event, handler);
        return () => undefined;
      },
    );

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
      listeners.get(TRAY_QUIT_EVENT)?.();
      await Promise.resolve();
    });

    expect(saveAllDirtyMock).toHaveBeenCalledOnce();
    expect(invokeMock).toHaveBeenCalledWith("request_app_exit");
  });

  it("flushes dirty notes on window hide without requesting exit", async () => {
    const listeners = new Map<string, () => void>();
    listenMock.mockImplementation(
      async (event: string, handler: () => void) => {
        listeners.set(event, handler);
        return () => undefined;
      },
    );

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
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
