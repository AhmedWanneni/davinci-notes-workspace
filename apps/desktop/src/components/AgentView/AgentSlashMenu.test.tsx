// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentSlashMenu } from "./AgentSlashMenu";
import type { LibraryItem } from "@app/ai-agent";

describe("AgentSlashMenu", () => {
  const sampleItems: LibraryItem[] = [
    {
      id: "lib-1",
      title: "Meeting Summary & Action Items",
      type: "skill",
      description: "Extract tasks and owners",
      content: "Please summarize meeting decisions and action items.",
      tags: ["Meetings"],
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: "lib-2",
      title: "Synthesize Project Wiki Note",
      type: "prompt",
      description: "Create interconnected markdown note",
      content: "Synthesize notes using [[Wikilinks]].",
      tags: ["Wiki"],
      createdAt: 2000,
      updatedAt: 2000,
    },
  ];

  it("renders matching prompt templates and skills when query is provided", () => {
    const onSelect = vi.fn();
    render(
      <AgentSlashMenu
        isOpen={true}
        query="meet"
        selectedIndex={0}
        onSelect={onSelect}
        onClose={vi.fn()}
        libraryItems={sampleItems}
      />,
    );

    expect(screen.getByText("Meeting Summary & Action Items")).toBeTruthy();
    expect(screen.queryByText("Synthesize Project Wiki Note")).toBeNull();

    fireEvent.click(screen.getByText("Meeting Summary & Action Items"));
    expect(onSelect).toHaveBeenCalledWith({
      kind: "library",
      item: sampleItems[0],
    });
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <AgentSlashMenu
        isOpen={false}
        query=""
        selectedIndex={0}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        libraryItems={sampleItems}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
