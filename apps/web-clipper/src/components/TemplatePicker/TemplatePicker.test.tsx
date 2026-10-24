import { fireEvent, render, screen } from "@testing-library/react";
import { ARTICLE_TEMPLATE, RECIPE_TEMPLATE } from "@app/clipper-core";
import { describe, expect, it, vi } from "vitest";
import { TemplatePicker } from "./TemplatePicker";

const TEMPLATES = [ARTICLE_TEMPLATE, RECIPE_TEMPLATE];

describe("TemplatePicker", () => {
  it("lists every template and marks the automatic choice", () => {
    render(
      <TemplatePicker
        templates={TEMPLATES}
        selectedId="recipe"
        onSelect={() => {}}
        matchedId="recipe"
      />,
    );

    const select = screen.getByLabelText("Template");
    expect(select).toHaveValue("recipe");
    expect(screen.getByText("Matched")).toBeInTheDocument();
    expect(
      screen.getByText("Chosen automatically for this page."),
    ).toBeInTheDocument();
  });

  it("reports a template the user chooses", () => {
    const onSelect = vi.fn();
    render(
      <TemplatePicker
        templates={TEMPLATES}
        selectedId="recipe"
        onSelect={onSelect}
        matchedId="recipe"
      />,
    );

    fireEvent.change(screen.getByLabelText("Template"), {
      target: { value: "article" },
    });

    expect(onSelect).toHaveBeenCalledWith("article");
  });

  it("explains when the choice is manual rather than matched", () => {
    render(
      <TemplatePicker
        templates={TEMPLATES}
        selectedId="article"
        onSelect={() => {}}
        matchedId="recipe"
      />,
    );

    expect(screen.queryByText("Matched")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "You chose this; the matching template is still available.",
      ),
    ).toBeInTheDocument();
  });

  it("says when no rule matched the page at all", () => {
    render(
      <TemplatePicker
        templates={TEMPLATES}
        selectedId="article"
        onSelect={() => {}}
      />,
    );

    expect(
      screen.getByText("No template rule matches this page."),
    ).toBeInTheDocument();
  });
});
