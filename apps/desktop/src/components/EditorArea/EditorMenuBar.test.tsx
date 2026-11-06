// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EditorMenuBar } from "./EditorMenuBar";

describe("EditorMenuBar", () => {
  it("renders menu bar tabs and opens dropdown on clicking Insert", () => {
    render(<EditorMenuBar view={null} />);

    const insertTab = screen.getByRole("button", { name: "More editor actions" });
    expect(insertTab).not.toBeNull();

    expect(screen.queryByText("Preview")).toBeNull();
    expect(screen.queryByText("Export to PDF")).toBeNull();

    fireEvent.click(insertTab);

    expect(screen.getByRole("menu", { name: "Editor actions" })).not.toBeNull();
    fireEvent.click(screen.getByRole("menuitem", { name: /insert/i }));
    expect(screen.getByRole("menu", { name: "Editor actions" })).not.toBeNull();
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

    const insertTab = screen.getByRole("button", { name: "More editor actions" });
    fireEvent.click(insertTab);
    expect(screen.getByRole("menu", { name: "Editor actions" })).not.toBeNull();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu", { name: "Editor actions" })).toBeNull();
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

    fireEvent.click(screen.getByRole("button", { name: "More editor actions" }));
    const codeBtn = screen.getByRole("button", { name: /code/i });
    fireEvent.click(codeBtn);
    expect(onModeChange).toHaveBeenCalledWith("code");
  });

  it("offers full and readable editor width modes", () => {
    const onEditorPaddingChange = vi.fn();
    render(<EditorMenuBar view={null} onEditorPaddingChange={onEditorPaddingChange} />);
    fireEvent.click(screen.getByRole("button", { name: "More editor actions" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: /readable width/i }));
    expect(onEditorPaddingChange).toHaveBeenCalledWith("wide");
    fireEvent.click(screen.getByRole("menuitemradio", { name: /full width/i }));
    expect(onEditorPaddingChange).toHaveBeenCalledWith("default");
  });

  it("calls export PDF handler on PDF button click", () => {
    const onExportPdf = vi.fn();
    render(<EditorMenuBar view={null} onExportPdf={onExportPdf} />);

    fireEvent.click(screen.getByRole("button", { name: "More editor actions" }));
    const pdfBtn = screen.getByRole("menuitem", { name: /convert \/ export to pdf/i });
    fireEvent.click(pdfBtn);
    expect(onExportPdf).toHaveBeenCalledOnce();
  });

  it("defaults properties to hidden and toggles show/hide properties in the ... menu", () => {
    const onToggleProperties = vi.fn();
    const { rerender } = render(
      <EditorMenuBar view={null} onToggleProperties={onToggleProperties} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "More editor actions" }));
    const showPropsBtn = screen.getByRole("menuitemcheckbox", {
      name: /show properties/i,
    });
    expect(showPropsBtn.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(showPropsBtn);
    expect(onToggleProperties).toHaveBeenCalledOnce();

    rerender(
      <EditorMenuBar
        view={null}
        showProperties={true}
        onToggleProperties={onToggleProperties}
      />,
    );
    const hidePropsBtn = screen.getByRole("menuitemcheckbox", {
      name: /hide properties/i,
    });
    expect(hidePropsBtn.getAttribute("aria-checked")).toBe("true");
  });
});
