import { useSyncExternalStore } from "react";

export interface MobileTab {
  id: string;
  path: string;
  title: string;
  previewText?: string;
  isNewTab?: boolean;
}

interface TabStoreState {
  tabs: MobileTab[];
  activeTabId: string;
}

let state: TabStoreState = {
  tabs: [
    {
      id: "tab-initial",
      path: "Untitled.md",
      title: "Untitled",
      previewText: "",
    },
  ],
  activeTabId: "tab-initial",
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function getTabStoreState(): TabStoreState {
  return state;
}

export function subscribeTabs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTabStore(): TabStoreState {
  return useSyncExternalStore(subscribeTabs, getTabStoreState, getTabStoreState);
}

export function openNoteInTab(path: string, previewText: string = ""): string {
  const existing = state.tabs.find((t) => t.path === path && !t.isNewTab);
  const title = path.replace(/\.md$/i, "").split("/").pop() ?? "Untitled";

  if (existing) {
    state = {
      ...state,
      tabs: state.tabs.map((t) =>
        t.id === existing.id ? { ...t, title, previewText: previewText || t.previewText } : t,
      ),
      activeTabId: existing.id,
    };
    notify();
    return existing.id;
  }

  const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newTab: MobileTab = { id, path, title, previewText };
  state = {
    tabs: [...state.tabs.filter((t) => !t.isNewTab), newTab],
    activeTabId: id,
  };
  notify();
  return id;
}

export function openNewTabLanding(): string {
  // If a New Tab landing already exists, just switch to it
  const existing = state.tabs.find((t) => t.isNewTab);
  if (existing) {
    state = { ...state, activeTabId: existing.id };
    notify();
    return existing.id;
  }

  const id = `tab-new-${Date.now()}`;
  const newTab: MobileTab = {
    id,
    path: "",
    title: "New tab",
    isNewTab: true,
  };
  state = {
    tabs: [...state.tabs, newTab],
    activeTabId: id,
  };
  notify();
  return id;
}

export function createUnsavedNewTab(): string {
  const id = `tab-newnote-${Date.now()}`;
  const newTab: MobileTab = {
    id,
    path: "Untitled.md",
    title: "Untitled",
    previewText: "",
  };
  state = {
    tabs: [...state.tabs.filter((t) => !t.isNewTab), newTab],
    activeTabId: id,
  };
  notify();
  return id;
}

export function updateActiveTabContent(content: string): void {
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
  if (!activeTab || activeTab.isNewTab) return;

  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  const previewText = lines.slice(0, 3).join("\n");

  state = {
    ...state,
    tabs: state.tabs.map((t) =>
      t.id === activeTab.id ? { ...t, previewText } : t,
    ),
  };
  notify();
}

export function setActiveTabId(id: string): void {
  if (state.tabs.some((t) => t.id === id)) {
    state = { ...state, activeTabId: id };
    notify();
  }
}

export function closeTab(id: string): void {
  const remaining = state.tabs.filter((t) => t.id !== id);
  if (remaining.length === 0) {
    const fallbackId = `tab-${Date.now()}`;
    state = {
      tabs: [{ id: fallbackId, path: "Untitled.md", title: "Untitled", previewText: "" }],
      activeTabId: fallbackId,
    };
  } else {
    let nextActive = state.activeTabId;
    if (state.activeTabId === id) {
      const idx = state.tabs.findIndex((t) => t.id === id);
      const nextIndex = Math.max(0, idx - 1);
      nextActive = remaining[nextIndex]?.id ?? remaining[0].id;
    }
    state = {
      tabs: remaining,
      activeTabId: nextActive,
    };
  }
  notify();
}
