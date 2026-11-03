// @vitest-environment jsdom
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AgentProjectContextPanel } from "./AgentProjectContextPanel";
import { useAgentStore } from "./useAgentStore";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

describe("AgentProjectContextPanel", () => {
  beforeEach(() => {
    act(() => {
      useAgentStore.setState({
        projectInstructions: {},
      });
    });
  });

  it("renders instructions, memory, capacity gauge, and context cards", () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    render(
      <AgentProjectContextPanel
        projectId="proj-1"
        sources={["Docs/Architecture.md", "Notes/Todo.md"]}
        onAddSource={onAdd}
        onRemoveSource={onRemove}
      />,
    );

    expect(screen.getByText("Instructions")).toBeTruthy();
    expect(screen.getByText("Memory")).toBeTruthy();
    expect(screen.getByText("Context")).toBeTruthy();
    expect(screen.getByText(/6% of project capacity used/i)).toBeTruthy();
    expect(screen.getByText("Architecture")).toBeTruthy();
    expect(screen.getByText("Todo")).toBeTruthy();
  });

  it("allows setting custom project instructions", () => {
    render(
      <AgentProjectContextPanel
        projectId="proj-1"
        sources={[]}
        onAddSource={vi.fn()}
        onRemoveSource={vi.fn()}
      />,
    );

    const editBtn = screen.getByRole("button", { name: /Edit instructions/i });
    fireEvent.click(editBtn);

    const input = screen.getByPlaceholderText(
      /Always respond in bullet points/i,
    );
    fireEvent.change(input, { target: { value: "Speak like a pirate" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(useAgentStore.getState().projectInstructions["proj-1"]).toBe(
      "Speak like a pirate",
    );
    expect(screen.getByText("Speak like a pirate")).toBeTruthy();
  });

  it("allows importing project instructions from a vault note and isolates per project", async () => {
    act(() => {
      useWorkspaceStore.setState({
        notesContent: {
          "Rules/CodingStyle.md": "Always write functional TypeScript.",
        },
      });
    });

    const { rerender } = render(
      <AgentProjectContextPanel
        projectId="proj-1"
        sources={[]}
        vaultNotes={["Rules/CodingStyle.md"]}
        onAddSource={vi.fn()}
        onRemoveSource={vi.fn()}
      />,
    );

    const importBtn = screen.getByRole("button", {
      name: /Import instructions from vault/i,
    });
    fireEvent.click(importBtn);

    const input = screen.getByPlaceholderText(/Import note from vault/i);
    fireEvent.change(input, { target: { value: "Rules/CodingStyle.md" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Import" }));
    });

    expect(useAgentStore.getState().projectInstructions["proj-1"]).toBe(
      "Always write functional TypeScript.",
    );
    expect(
      screen.getByText("Always write functional TypeScript."),
    ).toBeTruthy();

    // Switching to proj-2 must not leak proj-1 instructions
    rerender(
      <AgentProjectContextPanel
        projectId="proj-2"
        sources={[]}
        vaultNotes={["Rules/CodingStyle.md"]}
        onAddSource={vi.fn()}
        onRemoveSource={vi.fn()}
      />,
    );
    expect(
      screen.queryByText("Always write functional TypeScript."),
    ).toBeNull();
  });

  it("allows adding and removing context sources", () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    render(
      <AgentProjectContextPanel
        projectId="proj-1"
        sources={["Docs/Spec.md"]}
        vaultNotes={["Docs/Spec.md", "Docs/Readme.md"]}
        onAddSource={onAdd}
        onRemoveSource={onRemove}
      />,
    );

    const addBtn = screen.getByRole("button", { name: /Add note to context/i });
    fireEvent.click(addBtn);

    const input = screen.getByPlaceholderText(/Select note/i);
    fireEvent.change(input, { target: { value: "Docs/Readme.md" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith("Docs/Readme.md");

    const deleteBtn = screen.getByRole("button", {
      name: /Remove Docs\/Spec\.md/i,
    });
    fireEvent.click(deleteBtn);
    expect(onRemove).toHaveBeenCalledWith("Docs/Spec.md");
  });
});
