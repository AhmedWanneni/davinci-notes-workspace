// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AskYourVaultPanel } from "./AskYourVaultPanel";

describe("AskYourVaultPanel", () => {
  it("shows the cloud indicator and opens citations", async () => {
    const onOpenCitation = vi.fn();
    render(<AskYourVaultPanel cloudActive onOpenCitation={onOpenCitation} onAsk={async () => ({ answer: "Answer", retrieved: [], citations: [{ chunkId: "x", notePath: "note.md", heading: "Heading", startLine: 4, endLine: 5 }] })} />);
    expect(screen.getByText("Cloud AI active")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Question" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => expect(screen.getByText(/note.md/)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /note.md/ }));
    expect(onOpenCitation).toHaveBeenCalledWith("note.md", 4);
  });
});
