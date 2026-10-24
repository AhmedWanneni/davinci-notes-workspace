import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClipEditor } from "./ClipEditor";

const PROPERTIES = {
  author: "Ada Lovelace",
  source: "https://probe.example/a",
  authors: ["Ada", "Grace"],
} as const;

function editor(overrides: Partial<Parameters<typeof ClipEditor>[0]> = {}) {
  return {
    noteName: "Probe Article.md",
    folder: "Clippings",
    properties: PROPERTIES,
    onNoteNameChange: vi.fn(),
    onFolderChange: vi.fn(),
    onPropertyChange: vi.fn(),
    ...overrides,
  };
}

describe("ClipEditor", () => {
  it("shows the destination and the frontmatter the template produced", () => {
    render(<ClipEditor {...editor()} />);

    expect(screen.getByLabelText("Note name")).toHaveValue("Probe Article.md");
    expect(screen.getByLabelText("Folder")).toHaveValue("Clippings");
    expect(screen.getByLabelText("author")).toHaveValue("Ada Lovelace");
    expect(screen.getByLabelText("source")).toHaveValue(
      "https://probe.example/a",
    );
  });

  it("reports each edit to its own handler", () => {
    const onNoteNameChange = vi.fn();
    const onFolderChange = vi.fn();
    const onPropertyChange = vi.fn();
    render(
      <ClipEditor
        {...editor({ onNoteNameChange, onFolderChange, onPropertyChange })}
      />,
    );

    fireEvent.change(screen.getByLabelText("Note name"), {
      target: { value: "Probe Soup.md" },
    });
    fireEvent.change(screen.getByLabelText("Folder"), {
      target: { value: "Clippings/Soups" },
    });
    fireEvent.change(screen.getByLabelText("author"), {
      target: { value: "Grace Hopper" },
    });

    expect(onNoteNameChange).toHaveBeenCalledWith("Probe Soup.md");
    expect(onFolderChange).toHaveBeenCalledWith("Clippings/Soups");
    expect(onPropertyChange).toHaveBeenCalledWith("author", "Grace Hopper");
  });

  it("shows list-valued properties without offering to edit them", () => {
    render(<ClipEditor {...editor()} />);

    expect(screen.getByText("authors")).toBeInTheDocument();
    expect(screen.getByText("Ada, Grace")).toBeInTheDocument();
    // A label pointing at nothing would be an accessibility dead end.
    expect(screen.queryByLabelText("authors")).toBeNull();
  });

  it("leaves out the properties section when there is none", () => {
    render(<ClipEditor {...editor({ properties: {} })} />);

    expect(screen.queryByText("Properties")).toBeNull();
  });

  it("labels an unset folder as the vault root", () => {
    render(<ClipEditor {...editor({ folder: "" })} />);

    expect(screen.getByLabelText("Folder")).toHaveAttribute(
      "placeholder",
      "Vault root",
    );
  });
});
