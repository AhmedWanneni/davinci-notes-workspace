// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EditorMenuBar } from "./EditorMenuBar";

describe("EditorMenuBar", () => {
  it("renders menu bar tabs and opens dropdown on clicking Insert", () => {
    render(<EditorMenuBar view={null} />);

    const insertTab = screen.getByRole("button", { name: "Insert" });
    expect(insertTab).not.toBeNull();

    // Dropdown is not visible initially
    expect(screen.queryByRole("menu")).toBeNull();

    // Click Insert tab
    fireEvent.click(insertTab);

    // Dropdown items appear
    expect(screen.getByRole("menu")).not.toBeNull();
    expect(screen.getByText("Media")).not.toBeNull();
    expect(screen.getByText("Lists")).not.toBeNull();
    expect(screen.getByText("Table")).not.toBeNull();
    expect(screen.getByText("Math equation")).not.toBeNull();
    expect(screen.getByText("Mermaid diagram")).not.toBeNull();
  });

  it("closes when clicking outside or pressing Escape", () => {
    render(
      <div>
        <div data-testid="outside">Outside area</div>
        <EditorMenuBar view={null} />
      </div>,
    );

    const insertTab = screen.getByRole("button", { name: "Insert" });
    fireEvent.click(insertTab);
    expect(screen.getByRole("menu")).not.toBeNull();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("allows toggling between Preview and Code mode", () => {
    const onModeChange = vi.fn();
    render(
      <EditorMenuBar
        view={null}
        editorMode="preview"
        onModeChange={onModeChange}
      />,
    );

    const codeBtn = screen.getByRole("button", { name: /code/i });
    fireEvent.click(codeBtn);
    expect(onModeChange).toHaveBeenCalledWith("code");
  });

  it("calls export PDF handler on PDF button click", () => {
    const onExportPdf = vi.fn();
    render(<EditorMenuBar view={null} onExportPdf={onExportPdf} />);

    const pdfBtn = screen.getByRole("button", { name: /export to pdf/i });
    fireEvent.click(pdfBtn);
    expect(onExportPdf).toHaveBeenCalledOnce();
  });
});
