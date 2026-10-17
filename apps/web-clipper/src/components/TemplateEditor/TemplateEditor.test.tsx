import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ARTICLE_TEMPLATE, type ClipTemplate } from "@app/clipper-core";
import { TemplateEditor, type TemplateEditorProps } from "./TemplateEditor";

function props(
  overrides: Partial<TemplateEditorProps> = {},
): TemplateEditorProps {
  return {
    draft: { ...ARTICLE_TEMPLATE },
    errors: [],
    dirty: false,
    saving: false,
    onChange: vi.fn(),
    onPropertyChange: vi.fn(),
    onAddProperty: vi.fn(),
    onRemoveProperty: vi.fn(),
    onSave: vi.fn(),
    onDiscard: vi.fn(),
    ...overrides,
  };
}

describe("TemplateEditor", () => {
  it("shows the template's own values", () => {
    render(<TemplateEditor {...props()} />);

    expect(screen.getByLabelText("Template name")).toHaveValue("Article");
    expect(screen.getByLabelText("When a note already exists")).toHaveValue(
      "create",
    );
    expect(screen.getByLabelText("Note name")).toHaveValue(
      ARTICLE_TEMPLATE.noteNameFormat,
    );
    expect(screen.getByLabelText("Folder")).toHaveValue("Clippings");
    expect(screen.getByLabelText("Tags")).toHaveValue("clippings");
    expect(screen.getByLabelText("Apply automatically")).toHaveValue(
      "schema:@Article\nschema:@NewsArticle\nschema:@BlogPosting",
    );
  });

  it("routes an edit to the field it belongs to", () => {
    const onChange = vi.fn();
    render(<TemplateEditor {...props({ onChange })} />);

    fireEvent.change(screen.getByLabelText("Note name"), {
      target: { value: "{{site}} — {{title}}" },
    });
    expect(onChange).toHaveBeenCalledWith({
      noteNameFormat: "{{site}} — {{title}}",
    });

    fireEvent.change(screen.getByLabelText("Tags"), {
      target: { value: "clippings\ninbox\n" },
    });
    expect(onChange).toHaveBeenCalledWith({ tags: ["clippings", "inbox"] });
  });

  it("clears the vault when the field is emptied, rather than storing a blank name", () => {
    const onChange = vi.fn();
    render(
      <TemplateEditor
        {...props({ draft: { ...ARTICLE_TEMPLATE, vault: "Notes" }, onChange })}
      />,
    );

    fireEvent.change(screen.getByLabelText("Vault"), {
      target: { value: "  " },
    });
    expect(onChange).toHaveBeenCalledWith({ vault: undefined });
  });

  it("shows why a draft cannot be saved, and saves only a change", () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <TemplateEditor
        {...props({ errors: ["triggers[0] is empty"], dirty: true, onSave })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("triggers[0] is empty");
    fireEvent.click(screen.getByRole("button", { name: "Save template" }));
    expect(onSave).toHaveBeenCalledTimes(1);

    rerender(<TemplateEditor {...props({ dirty: false, onSave })} />);
    expect(
      screen.getByRole("button", { name: "Save template" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Discard changes" }),
    ).toBeDisabled();
  });

  it("edits and removes a property by its position", () => {
    const onPropertyChange = vi.fn();
    const onRemoveProperty = vi.fn();
    render(
      <TemplateEditor {...props({ onPropertyChange, onRemoveProperty })} />,
    );

    fireEvent.change(screen.getByLabelText("Property 1 name"), {
      target: { value: "creator" },
    });
    expect(onPropertyChange).toHaveBeenCalledWith(0, { name: "creator" });

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    expect(removeButtons).toHaveLength(ARTICLE_TEMPLATE.properties.length);
    fireEvent.click(removeButtons[1]);
    expect(onRemoveProperty).toHaveBeenCalledWith(1);
  });

  it("says the note body is a template, not the note itself", () => {
    const draft: ClipTemplate = { ...ARTICLE_TEMPLATE, body: "{{content}}" };
    render(<TemplateEditor {...props({ draft })} />);
    expect(screen.getByLabelText("Note body")).toHaveValue("{{content}}");
  });

  it("toggles the save images to vault switch", () => {
    const onChange = vi.fn();
    render(<TemplateEditor {...props({ onChange })} />);
    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith({ downloadImages: true });
  });
});
