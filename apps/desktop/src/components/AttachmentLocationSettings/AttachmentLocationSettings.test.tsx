// @vitest-environment jsdom
import { render, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_ATTACHMENT_SETTINGS } from "@app/attachments";
import { AttachmentLocationSettings } from "./AttachmentLocationSettings";

describe("AttachmentLocationSettings", () => {
  it("shows each conditional control only for its selected mode", () => {
    const onChange = vi.fn();
    const { rerender, queryByLabelText } = render(
      <AttachmentLocationSettings settings={DEFAULT_ATTACHMENT_SETTINGS} onChange={onChange} />,
    );
    expect(queryByLabelText("Specified attachment folder")).toBeNull();
    expect(queryByLabelText("Attachment subfolder")).toBeNull();

    rerender(<AttachmentLocationSettings
      settings={{ ...DEFAULT_ATTACHMENT_SETTINGS, locationMode: "specified-folder" }}
      onChange={onChange}
    />);
    expect(queryByLabelText("Specified attachment folder")).not.toBeNull();

    rerender(<AttachmentLocationSettings
      settings={{ ...DEFAULT_ATTACHMENT_SETTINGS, locationMode: "note-subfolder" }}
      onChange={onChange}
    />);
    expect(queryByLabelText("Attachment subfolder")).not.toBeNull();
  });

  it("persists a mode selection through the supplied schema callback", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <AttachmentLocationSettings settings={DEFAULT_ATTACHMENT_SETTINGS} onChange={onChange} />,
    );
    fireEvent.click(getByLabelText("Same folder as current file"));
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_ATTACHMENT_SETTINGS,
      locationMode: "note-folder",
    });
  });
});
