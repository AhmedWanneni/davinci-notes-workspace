// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TodosView } from "./TodosView";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import * as vaultModule from "../../vault";

vi.mock("../../vault", () => ({
  createNoteInVault: vi.fn().mockResolvedValue(""),
  createFolder: vi.fn().mockResolvedValue(undefined),
  createFolderInVault: vi.fn().mockResolvedValue(""),
  deleteFolderInVault: vi.fn().mockResolvedValue({ ok: true }),
  deleteNoteInVault: vi.fn().mockResolvedValue({ ok: true }),
  writeNote: vi.fn().mockResolvedValue(undefined),
}));

const SAMPLE_MD_1 = `## V1 Concepts
- [ ] Create wireframes for new dash [01 Aug]
- [ ] Outline in UX guide [[UX Guide]]

## Icons
- [ ] Create design system for icon styles
`;

const SAMPLE_MD_2 = `## Morning
- [ ] ⏰ Wake up on time
- [ ] 🏃 Gym / workout

## Night
- [ ] 📱 No phone 30 mins before sleep
`;

describe("TodosView", () => {
  const onOpenNoteMock = vi.fn();
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({
      vaultPath: "/Users/demo/MyVault",
      allFolderPaths: ["todos", "todos/Design", "todos/Daily"],
      allNotePaths: [
        "todos/Design/Admin Dashboard.md",
        "todos/Daily/Daily Focus.md",
      ],
      notesContent: {
        "todos/Design/Admin Dashboard.md": SAMPLE_MD_1,
        "todos/Daily/Daily Focus.md": SAMPLE_MD_2,
      },
    });
  });

  it("renders Motherboard, Projects section, and sections without calendar or extra icons", async () => {
    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    expect(screen.getByText("Motherboard")).toBeDefined();
    expect(screen.getAllByText("Projects").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Design").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Admin Dashboard").length).toBeGreaterThan(0);
    expect(screen.getByText("V1 Concepts")).toBeDefined();
    expect(screen.getByText(/Create wireframes for new dash/i)).toBeDefined();

    expect(screen.queryByTitle("Calendar")).toBeNull();
    expect(screen.queryByTitle("More actions")).toBeNull();
  });

  it("does not automatically create notes if nothing exists in vault", async () => {
    useWorkspaceStore.setState({
      allFolderPaths: [],
      allNotePaths: [],
      notesContent: {},
    });

    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    expect(vaultModule.createNoteInVault).not.toHaveBeenCalled();
    expect(screen.getByText(/No tasks found/i)).toBeDefined();
  });

  it("switches to Motherboard view when clicked in sidebar", async () => {
    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    const motherboardBtn = screen.getByText("Motherboard");
    fireEvent.click(motherboardBtn);

    expect(screen.getByTestId("motherboard-cards")).toBeDefined();
    expect(screen.getByTitle("Cards view")).toBeDefined();
    expect(screen.getByTitle("List view")).toBeDefined();

    const listBtn = screen.getByTitle("List view");
    fireEvent.click(listBtn);
    expect(screen.getByTestId("motherboard-list")).toBeDefined();
  });

  it("switches project when clicked in the sidebar", async () => {
    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    const dailyProject = screen.getByText("Daily");
    fireEvent.click(dailyProject);

    expect(screen.getByText("Morning")).toBeDefined();
    expect(screen.getByText(/Wake up on time/i)).toBeDefined();
  });

  it("creates an empty project folder without generating notes", async () => {
    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    const addProjectBtn = screen.getByText("Add Project");
    await act(async () => {
      fireEvent.click(addProjectBtn);
    });

    const input = screen.getByPlaceholderText(/New project name/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: "Roadmap" } });
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(vaultModule.createFolder).toHaveBeenCalledWith("todos/Roadmap");
    expect(vaultModule.createNoteInVault).not.toHaveBeenCalledWith(
      expect.stringContaining("Roadmap"),
      expect.anything(),
    );
  });

  it("deletes project from vault when delete icon is clicked", async () => {
    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    const deleteBtn = screen.getByLabelText("Delete project Design");
    fireEvent.click(deleteBtn);

    expect(vaultModule.deleteFolderInVault).toHaveBeenCalledWith(
      "todos/Design",
    );
  });

  it("filters todos by search input", async () => {
    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    const searchInput = screen.getByPlaceholderText("Search tasks...");
    fireEvent.change(searchInput, { target: { value: "wireframes" } });

    expect(screen.getByText(/Create wireframes for new dash/i)).toBeDefined();
    expect(screen.queryByText(/Outline in UX guide/i)).toBeNull();
  });

  it("opens focus mode as a separate centered dialog and closes via back or close button", async () => {
    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    const focusModeBtn = screen.getByTitle("Open Focus Mode");
    fireEvent.click(focusModeBtn);

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Back to App")).toBeDefined();
    expect(screen.getByTitle("Close")).toBeDefined();
    expect(screen.getAllByText("Add task").length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText("Create task")).toBeNull();

    const closeBtn = screen.getByTitle("Close");
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByPlaceholderText("Search tasks...")).toBeDefined();
  });

  it("navigates to linked note when link badge is clicked", async () => {
    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    const linkBadge = screen.getByTitle("Open linked note: UX Guide");
    fireEvent.click(linkBadge);

    expect(onOpenNoteMock).toHaveBeenCalledWith("UX Guide");
  });
});
