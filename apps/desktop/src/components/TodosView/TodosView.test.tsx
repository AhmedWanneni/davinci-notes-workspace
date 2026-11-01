// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TodosView } from "./TodosView";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

vi.mock("../../vault", () => ({
  createNoteInVault: vi.fn().mockResolvedValue(""),
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
      allNotePaths: [
        "todos/Design/Admin Dashboard.md",
        "todos/Routines/Daily Focus.md",
      ],
      notesContent: {
        "todos/Design/Admin Dashboard.md": SAMPLE_MD_1,
        "todos/Routines/Daily Focus.md": SAMPLE_MD_2,
      },
    });
  });

  it("renders workspace, project, sections and todo items", async () => {
    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    expect(screen.getByText("Workspaces")).toBeDefined();
    expect(screen.getByText("Design")).toBeDefined();
    expect(screen.getAllByText("Admin Dashboard").length).toBeGreaterThan(0);
    expect(screen.getByText("V1 Concepts")).toBeDefined();
    expect(
      screen.getByText(/Create wireframes for new dash/i),
    ).toBeDefined();
    expect(screen.getByText("01 Aug")).toBeDefined();
    expect(screen.getByText("UX Guide")).toBeDefined();
  });

  it("switches project when clicked in the sidebar", async () => {
    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    const routinesWorkspace = screen.getByText("Routines");
    fireEvent.click(routinesWorkspace);

    const dailyFocusProject = screen.getByText("Daily Focus");
    fireEvent.click(dailyFocusProject);

    expect(screen.getByText("Morning")).toBeDefined();
    expect(screen.getByText(/Wake up on time/i)).toBeDefined();
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

  it("switches to focus mode and back to app", async () => {
    await act(async () => {
      render(<TodosView onOpenNote={onOpenNoteMock} onClose={onCloseMock} />);
    });

    const focusModeBtn = screen.getByTitle("Open Focus Mode");
    fireEvent.click(focusModeBtn);

    expect(screen.getByText("Back to App")).toBeDefined();

    const backBtn = screen.getByText("Back to App");
    fireEvent.click(backBtn);

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
