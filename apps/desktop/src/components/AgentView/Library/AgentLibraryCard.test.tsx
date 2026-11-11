// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentLibraryCard } from "./AgentLibraryCard";
import type { LibraryItem } from "@app/ai-agent";

describe("AgentLibraryCard", () => {
  const dummyItem: LibraryItem = {
    id: "card-1",
    type: "skill",
    title: "Code Reviewer",
    description: "Inspect diff and verify code quality",
    content: "Review this diff for security bugs",
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  };

  it("renders card details and handles actions", () => {
    const onToggleSelect = vi.fn();
    const onUseInPrompt = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <AgentLibraryCard
        item={dummyItem}
        projectName="DevOps"
        isSelected={false}
        onToggleSelect={onToggleSelect}
        onUseInPrompt={onUseInPrompt}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("Code Reviewer")).toBeTruthy();
    expect(screen.getByText("skill")).toBeTruthy();
    expect(screen.getByText("DevOps")).toBeTruthy();
    expect(
      screen.getByText("Inspect diff and verify code quality"),
    ).toBeTruthy();

    const selectBtn = screen.getByLabelText("Select Code Reviewer");
    fireEvent.click(selectBtn);
    expect(onToggleSelect).toHaveBeenCalled();

    const useInPromptBtn = screen.getByLabelText("Use Code Reviewer in prompt");
    fireEvent.click(useInPromptBtn);
    expect(onUseInPrompt).toHaveBeenCalled();

    const editBtn = screen.getByLabelText("Edit Code Reviewer");
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalled();

    const deleteBtn = screen.getByLabelText("Delete Code Reviewer");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalled();
  });
});
