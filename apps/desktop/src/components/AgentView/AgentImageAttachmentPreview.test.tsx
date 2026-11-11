// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentImageAttachmentPreview } from "./AgentImageAttachmentPreview";

describe("AgentImageAttachmentPreview", () => {
  it("renders image cards and file/skill attachment cards with badges", () => {
    const onRemoveImage = vi.fn();
    const onRemoveItem = vi.fn();

    render(
      <AgentImageAttachmentPreview
        images={["data:image/png;base64,abc"]}
        items={[
          {
            id: "att-1",
            kind: "file",
            name: "Contacts _ All contacts.html",
            badge: "HTML",
            content: "<html></html>",
          },
          {
            id: "att-2",
            kind: "skill",
            name: "Security Audit",
            badge: "SKILL",
            content: "Audit all endpoints",
          },
        ]}
        onRemove={onRemoveImage}
        onRemoveItem={onRemoveItem}
      />,
    );

    expect(screen.getByAltText("Attachment 1")).toBeTruthy();
    expect(screen.getByText("Contacts _ All contacts.html")).toBeTruthy();
    expect(screen.getByText("HTML")).toBeTruthy();
    expect(screen.getByText("Security Audit")).toBeTruthy();
    expect(screen.getByText("SKILL")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Remove image"));
    expect(onRemoveImage).toHaveBeenCalledWith(0);

    fireEvent.click(
      screen.getByLabelText("Remove Contacts _ All contacts.html"),
    );
    expect(onRemoveItem).toHaveBeenCalledWith("att-1");
  });
});
