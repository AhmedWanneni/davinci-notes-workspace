// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentSaveNoteModal } from "./AgentSaveNoteModal";

vi.mock("../../vault/createNoteInVault", () => ({
  createNoteInVault: vi.fn().mockResolvedValue("test.md"),
}));

describe("AgentSaveNoteModal", () => {
  it("renders when open and allows switching tabs", () => {
    render(
      <AgentSaveNoteModal
        isOpen={true}
        onClose={vi.fn()}
        content="# Hello World"
      />,
    );

    expect(screen.getByText("Save Response to Vault")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Create New Note" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Append to Existing" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Append to Existing" }));
    expect(screen.getByPlaceholderText("Filter notes...")).toBeTruthy();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <AgentSaveNoteModal isOpen={false} onClose={vi.fn()} content="test" />,
    );
    expect(container.firstChild).toBeNull();
  });
});
