// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentMentionMenu } from "./AgentMentionMenu";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

describe("AgentMentionMenu", () => {
  it("renders filtered files and folders and handles selection", () => {
    useWorkspaceStore.setState({
      allNotePaths: ["Work/Meeting.md", "Personal/Ideas.md"],
      allFolderPaths: ["Work", "Personal"],
    });

    const onSelect = vi.fn();
    render(
      <AgentMentionMenu
        isOpen={true}
        query="work"
        selectedIndex={0}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Referenced Files & Folders")).toBeDefined();
    expect(screen.getByText("Work/")).toBeDefined();
    expect(screen.getByText("Meeting.md")).toBeDefined();

    fireEvent.click(screen.getByText("Meeting.md"));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ path: "Work/Meeting.md" }),
    );
  });
});
