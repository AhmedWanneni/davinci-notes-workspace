import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClipPreview } from "./ClipPreview";

describe("ClipPreview", () => {
  it("shows the tags and the note body", () => {
    const { container } = render(
      <ClipPreview
        tags={["clippings", "reading"]}
        body={"# Probe Article\n\nBody."}
      />,
    );

    expect(screen.getByText("Tags: clippings, reading")).toBeInTheDocument();
    expect(container.querySelector("pre")?.textContent).toBe(
      "# Probe Article\n\nBody.",
    );
  });

  it("omits the tag line when there are no tags", () => {
    render(<ClipPreview tags={[]} body="Body." />);

    expect(screen.queryByText(/^Tags:/)).toBeNull();
  });

  it("says so when there is no content instead of showing an empty file", () => {
    render(<ClipPreview tags={[]} body="" />);

    expect(screen.getByText("Nothing to clip here.")).toBeInTheDocument();
  });

  it("truncates a huge body and reports what is left in the saved file", () => {
    render(
      <ClipPreview tags={[]} body={"x".repeat(150)} visibleBodyLength={100} />,
    );

    expect(screen.getByText("x".repeat(100))).toBeInTheDocument();
    expect(
      screen.getByText("50 more characters in the saved file."),
    ).toBeInTheDocument();
  });

  it("renders hostile page content as text, never as markup", () => {
    const hostile = "<script>window.__clipperPwned = 1</script>";
    const { container } = render(
      <ClipPreview
        tags={[hostile]}
        body={`${hostile}\n\n<img src=x onerror=alert(1)>`}
      />,
    );

    expect(screen.getByText(`Tags: ${hostile}`)).toBeInTheDocument();
    expect(container.querySelector("pre")?.textContent).toContain(hostile);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});
