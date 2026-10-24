import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ARTICLE_TEMPLATE } from "@app/clipper-core";
import { describe, expect, it, vi } from "vitest";
import { TemplateTransferControls } from "./TemplateTransferControls";

describe("TemplateTransferControls", () => {
  it("opens a JSON-only file chooser and forwards its text", async () => {
    const onImport = vi.fn();
    const { container } = render(
      <TemplateTransferControls
        templates={[ARTICLE_TEMPLATE]}
        disabled={false}
        onImport={onImport}
      />,
    );
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("accept", "application/json,.json");

    const file = new File(["[]"], "templates.json", {
      type: "application/json",
    });
    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });
    await waitFor(() => expect(onImport).toHaveBeenCalledWith("[]"));
  });

  it("blocks both transfers while storage is busy", () => {
    render(
      <TemplateTransferControls
        templates={[ARTICLE_TEMPLATE]}
        disabled
        onImport={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Export templates" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Import templates" }),
    ).toBeDisabled();
  });
});
