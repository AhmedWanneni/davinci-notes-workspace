// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentConversationHeader } from "./AgentConversationHeader";

describe("AgentConversationHeader", () => {
  it("renders project tag, title, plus button, and pin button", () => {
    const onNav = vi.fn();
    render(
      <AgentConversationHeader
        title="Syncing issue fix"
        projectName="Obsidian tauri app"
        projectId="proj-1"
        onNavigateProject={onNav}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Syncing issue fix" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Obsidian tauri app" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "New chat in project" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Pin conversation" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Obsidian tauri app" }));
    expect(onNav).toHaveBeenCalledWith("proj-1");

    fireEvent.click(
      screen.getByRole("button", { name: "New chat in project" }),
    );
    expect(onNav).toHaveBeenCalledWith("proj-1");
  });

  it("handles dropdown actions: Rename and Delete", () => {
    const onRename = vi.fn();
    const onDelete = vi.fn();
    render(
      <AgentConversationHeader
        title="Chat"
        onRename={onRename}
        onDelete={onDelete}
      />,
    );

    const moreBtn = screen.getByRole("button", { name: "More options" });
    fireEvent.click(moreBtn);

    const renameBtn = screen.getByText("Rename");
    fireEvent.click(renameBtn);
    expect(onRename).toHaveBeenCalled();

    fireEvent.click(moreBtn);
    const deleteBtn = screen.getByText("Delete");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalled();
  });
});
