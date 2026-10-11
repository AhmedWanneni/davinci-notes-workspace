// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SearchResult } from "@app/indexer";
import {
  QuickSearchList,
  formatNoteTitle,
  getNoteFolder,
} from "./QuickSearchList";

describe("QuickSearchList", () => {
  it("formats note titles and parent folders safely", () => {
    expect(formatNoteTitle("ideas/startups.md", "My Startups")).toBe(
      "My Startups",
    );
    expect(formatNoteTitle("ideas/startups.md", "")).toBe("startups");
    expect(formatNoteTitle("root.md")).toBe("root");

    expect(getNoteFolder("work/projects/alpha.md")).toBe("work/projects");
    expect(getNoteFolder("root.md")).toBe("/");
  });

  it("renders status messages for empty, searching, no results, and error states", () => {
    const onSelect = vi.fn();
    const onHover = vi.fn();

    const { rerender } = render(
      <QuickSearchList
        results={[]}
        selectedIndex={0}
        isLoading={false}
        isError={false}
        query=""
        onSelect={onSelect}
        onHoverIndex={onHover}
      />,
    );
    expect(screen.getByText("Type to search notes...")).toBeDefined();

    rerender(
      <QuickSearchList
        results={[]}
        selectedIndex={0}
        isLoading={true}
        isError={false}
        query="notes"
        onSelect={onSelect}
        onHoverIndex={onHover}
      />,
    );
    expect(screen.getByText("Searching...")).toBeDefined();

    rerender(
      <QuickSearchList
        results={[]}
        selectedIndex={0}
        isLoading={false}
        isError={false}
        query="nonexistent"
        onSelect={onSelect}
        onHoverIndex={onHover}
      />,
    );
    expect(screen.getByText("No matching notes found")).toBeDefined();

    rerender(
      <QuickSearchList
        results={[]}
        selectedIndex={0}
        isLoading={false}
        isError={true}
        query="crash"
        onSelect={onSelect}
        onHoverIndex={onHover}
      />,
    );
    expect(screen.getByText("Search index unavailable")).toBeDefined();
  });

  it("renders result items as safe text and triggers onSelect on click", () => {
    const onSelect = vi.fn();
    const onHover = vi.fn();
    const results: SearchResult[] = [
      { path: "folder/test.md", title: "Test Note", mtime: 1, score: -1 },
      {
        path: "<script>alert(1)</script>.md",
        title: "<b>Unsafe</b>",
        mtime: 2,
        score: -2,
      },
    ];

    render(
      <QuickSearchList
        results={results}
        selectedIndex={0}
        isLoading={false}
        isError={false}
        query="test"
        onSelect={onSelect}
        onHoverIndex={onHover}
      />,
    );

    expect(screen.getByText("Test Note")).toBeDefined();
    expect(screen.getByText("folder")).toBeDefined();

    // Verify untrusted titles and paths render as literal strings
    expect(screen.getByText("<b>Unsafe</b>")).toBeDefined();
    expect(document.querySelector("b")).toBeNull();

    // Click item
    fireEvent.click(screen.getByText("Test Note"));
    expect(onSelect).toHaveBeenCalledWith("folder/test.md");
  });
});
