import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ARTICLE_TEMPLATE } from "@app/clipper-core";
import {
  TemplatePropertiesEditor,
  type TemplatePropertiesEditorProps,
} from "./TemplatePropertiesEditor";

function props(
  overrides: Partial<TemplatePropertiesEditorProps> = {},
): TemplatePropertiesEditorProps {
  return {
    properties: ARTICLE_TEMPLATE.properties,
    onChange: vi.fn(),
    onAdd: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  };
}

describe("TemplatePropertiesEditor", () => {
  it("shows the properties in the order the template lists them", () => {
    render(<TemplatePropertiesEditor {...props()} />);

    expect(screen.getByLabelText("Property 1 name")).toHaveValue("author");
    expect(screen.getByLabelText("Property 2 value")).toHaveValue(
      '{{published|date:"YYYY-MM-DD"}}',
    );
  });

  it("routes an edit to the row it belongs to", () => {
    const onChange = vi.fn();
    render(<TemplatePropertiesEditor {...props({ onChange })} />);

    fireEvent.change(screen.getByLabelText("Property 3 value"), {
      target: { value: "{{description|strip}}" },
    });
    expect(onChange).toHaveBeenCalledWith(2, {
      value: "{{description|strip}}",
    });
  });

  it("says what happens when a template has no properties", () => {
    render(<TemplatePropertiesEditor {...props({ properties: [] })} />);

    expect(screen.getByText(/No properties/u)).toBeInTheDocument();
    expect(screen.queryByLabelText("Property 1 name")).not.toBeInTheDocument();
  });

  it("adds and removes rows", () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    render(<TemplatePropertiesEditor {...props({ onAdd, onRemove })} />);

    fireEvent.click(screen.getByRole("button", { name: "Add property" }));
    expect(onAdd).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Remove" })[2] as HTMLElement,
    );
    expect(onRemove).toHaveBeenCalledWith(2);
  });
});
