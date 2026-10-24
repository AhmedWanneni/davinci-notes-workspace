import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ARTICLE_TEMPLATE, STARTER_TEMPLATES } from "@app/clipper-core";
import type { TemplateLibraryController } from "../../templates/useTemplateLibrary";
import { TemplatesPanel } from "./TemplatesPanel";

function controller(
  overrides: Partial<TemplateLibraryController> = {},
): TemplateLibraryController {
  return {
    loading: false,
    templates: STARTER_TEMPLATES,
    selectedId: "article",
    draft: ARTICLE_TEMPLATE,
    dirty: false,
    errors: [],
    saving: false,
    select: vi.fn(),
    create: vi.fn(),
    duplicate: vi.fn(),
    remove: vi.fn(),
    restoreStarters: vi.fn(),
    importTemplates: vi.fn(),
    patch: vi.fn(),
    setProperty: vi.fn(),
    addProperty: vi.fn(),
    removeProperty: vi.fn(),
    save: vi.fn(),
    discard: vi.fn(),
    ...overrides,
  };
}

describe("TemplatesPanel", () => {
  it("lists the stored templates in order and marks the one being edited", () => {
    render(<TemplatesPanel controller={controller()} />);

    expect(
      screen.getAllByRole("button", { name: /Article|Recipe|Movie|Paper/u }),
    ).toHaveLength(STARTER_TEMPLATES.length);
    expect(screen.getByRole("button", { name: "Article" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Recipe" })).toHaveAttribute(
      "aria-current",
      "false",
    );
  });

  it("opens the template the user picks", () => {
    const select = vi.fn();
    render(<TemplatesPanel controller={controller({ select })} />);

    fireEvent.click(screen.getByRole("button", { name: "Recipe" }));
    expect(select).toHaveBeenCalledWith("recipe");
  });

  it("routes each toolbar action to the controller", () => {
    const handlers = {
      create: vi.fn(),
      duplicate: vi.fn(),
      remove: vi.fn(),
      restoreStarters: vi.fn(),
    };
    render(<TemplatesPanel controller={controller(handlers)} />);

    fireEvent.click(screen.getByRole("button", { name: "New template" }));
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Restore starter templates" }),
    );

    expect(handlers.create).toHaveBeenCalledTimes(1);
    expect(handlers.duplicate).toHaveBeenCalledTimes(1);
    expect(handlers.remove).toHaveBeenCalledTimes(1);
    expect(handlers.restoreStarters).toHaveBeenCalledTimes(1);
  });

  it("cannot duplicate or delete nothing", () => {
    render(
      <TemplatesPanel
        controller={controller({ draft: undefined, selectedId: undefined })}
      />,
    );

    expect(screen.getByRole("button", { name: "Duplicate" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(
      screen.getByText("Select a template to edit it."),
    ).toBeInTheDocument();
  });

  it("says when it is still reading, and reports a write that failed", () => {
    const { rerender } = render(
      <TemplatesPanel controller={controller({ loading: true })} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Reading the saved templates",
    );

    rerender(
      <TemplatesPanel
        controller={controller({
          failure: "Quota exceeded.",
          notice: undefined,
        })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Quota exceeded.");
  });
});
