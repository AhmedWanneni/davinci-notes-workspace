import { fireEvent, render, screen } from "@testing-library/react";
import { ARTICLE_TEMPLATE, type ClipPayload } from "@app/clipper-core";
import { describe, expect, it, vi } from "vitest";
import { ClipPopup, type ClipPopupController } from "./ClipPopup";

const PAYLOAD: ClipPayload = {
  version: 1,
  clipId: "clip-1",
  capturedAt: "2026-10-17T09:05:07.000Z",
  mode: "full",
  templateId: ARTICLE_TEMPLATE.id,
  behavior: "create",
  target: { folder: "Clippings", noteName: "Probe Article.md" },
  source: {
    url: "https://probe.example/a",
    title: "Probe Article",
    site: "probe.example",
    wordCount: 412,
  },
  properties: { source: "https://probe.example/a" },
  tags: ["clippings"],
  body: "# Probe Article\n\nBody.",
  contentHash: "3a1f",
};

function controller(
  overrides: Partial<ClipPopupController> = {},
): ClipPopupController {
  return {
    status: "ready",
    mode: "full",
    templates: [ARTICLE_TEMPLATE],
    templateId: ARTICLE_TEMPLATE.id,
    disabledModes: ["highlights"],
    payload: PAYLOAD,
    draft: {
      noteName: PAYLOAD.target.noteName,
      folder: PAYLOAD.target.folder,
      properties: PAYLOAD.properties,
    },
    paired: false,
    sending: false,
    downloading: false,
    sent: false,
    setMode: vi.fn(),
    setTemplateId: vi.fn(),
    setNoteName: vi.fn(),
    setFolder: vi.fn(),
    setProperty: vi.fn(),
    send: vi.fn(),
    download: vi.fn(),
    openOptions: vi.fn(),
    ...overrides,
  };
}

describe("ClipPopup", () => {
  it("shows what is being read while the page loads", () => {
    render(
      <ClipPopup
        controller={controller({ status: "loading", payload: undefined })}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Reading the page…");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("explains an unreadable page instead of showing an empty form", () => {
    render(
      <ClipPopup
        controller={controller({
          status: "error",
          error: "This page could not be read.",
          payload: undefined,
        })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This page could not be read.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Browser settings pages/,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the whole form once the page is ready", () => {
    render(<ClipPopup controller={controller()} />);

    expect(screen.getByText("Save to DaVinci Notes")).toBeInTheDocument();
    expect(screen.getByText("probe.example · 412 words")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Full page/ })).toBeChecked();
    expect(screen.getByLabelText("Template")).toHaveValue(ARTICLE_TEMPLATE.id);
    expect(screen.getByLabelText("Note name")).toHaveValue("Probe Article.md");
    expect(screen.getByLabelText("Folder")).toHaveValue("Clippings");
    expect(screen.getByRole("button", { name: "Download .md" })).toBeEnabled();
  });

  it("keeps the direct-to-desktop button out of reach until it is paired", () => {
    const openOptions = vi.fn();
    render(<ClipPopup controller={controller({ openOptions })} />);

    expect(
      screen.getByRole("button", { name: "Add to DaVinci Notes" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/not paired with DaVinci Notes/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pairing options" }));
    expect(openOptions).toHaveBeenCalledTimes(1);
  });

  it("sends the clip to the app once it is paired", () => {
    const send = vi.fn();
    render(<ClipPopup controller={controller({ paired: true, send })} />);

    const button = screen.getByRole("button", { name: "Add to DaVinci Notes" });
    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(send).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Pairing options" }),
    ).toBeNull();
  });

  it("says where the app wrote the clip", () => {
    render(
      <ClipPopup
        controller={controller({
          paired: true,
          sent: true,
          sentPath: "Clippings/Probe Article.md",
        })}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Saved to Clippings/Probe Article.md.",
    );
  });

  it("still says the clip was saved when the app reported no path", () => {
    render(<ClipPopup controller={controller({ paired: true, sent: true })} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Saved to your vault.",
    );
  });

  it("blocks a second send while one is in flight", () => {
    render(
      <ClipPopup controller={controller({ paired: true, sending: true })} />,
    );

    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
  });

  it("warns when the article could not be extracted", () => {
    render(
      <ClipPopup
        controller={controller({
          warning:
            "The article could not be extracted, so the note contains only the page metadata.",
        })}
      />,
    );

    expect(screen.getByText(/could not be extracted/)).toBeInTheDocument();
    // A warning is not a failure: the clip can still be saved.
    expect(screen.getByRole("button", { name: "Download .md" })).toBeEnabled();
  });

  it("routes interactions back to the controller", () => {
    const setMode = vi.fn();
    const setTemplateId = vi.fn();
    const setNoteName = vi.fn();
    const setFolder = vi.fn();
    const setProperty = vi.fn();
    const download = vi.fn();
    render(
      <ClipPopup
        controller={controller({
          setMode,
          setTemplateId,
          setNoteName,
          setFolder,
          setProperty,
          download,
        })}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Selection/ }));
    fireEvent.change(screen.getByLabelText("Template"), {
      target: { value: ARTICLE_TEMPLATE.id },
    });
    fireEvent.change(screen.getByLabelText("Note name"), {
      target: { value: "Renamed.md" },
    });
    fireEvent.change(screen.getByLabelText("Folder"), {
      target: { value: "Clippings/Web" },
    });
    fireEvent.change(screen.getByLabelText("source"), {
      target: { value: "https://probe.example/b" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Download .md" }));

    expect(setMode).toHaveBeenCalledWith("selection");
    expect(setTemplateId).toHaveBeenCalledWith(ARTICLE_TEMPLATE.id);
    expect(setNoteName).toHaveBeenCalledWith("Renamed.md");
    expect(setFolder).toHaveBeenCalledWith("Clippings/Web");
    expect(setProperty).toHaveBeenCalledWith(
      "source",
      "https://probe.example/b",
    );
    expect(download).toHaveBeenCalledTimes(1);
  });

  it("allows highlighting the selection when a selection is present", () => {
    const highlightSelection = vi.fn();
    render(
      <ClipPopup
        controller={controller({
          canHighlightSelection: true,
          highlightSelection,
        })}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Highlight selection" }),
    );
    expect(highlightSelection).toHaveBeenCalledTimes(1);
  });

  it("shows a failed save without losing the form", () => {
    render(
      <ClipPopup
        controller={controller({ error: "The note could not be saved." })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The note could not be saved.",
    );
    expect(screen.getByRole("button", { name: "Download .md" })).toBeEnabled();
  });

  it("blocks a second download while one is in flight", () => {
    render(<ClipPopup controller={controller({ downloading: true })} />);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  });

  it("renders Bookmark in DaVinci Notes CTA and hides template picker in bookmark mode", () => {
    render(
      <ClipPopup
        controller={controller({
          mode: "bookmark",
          paired: true,
          payload: { ...PAYLOAD, mode: "bookmark" },
        })}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Bookmark in DaVinci Notes" }),
    ).toBeEnabled();
    expect(screen.queryByLabelText("Template")).toBeNull();
  });
});
