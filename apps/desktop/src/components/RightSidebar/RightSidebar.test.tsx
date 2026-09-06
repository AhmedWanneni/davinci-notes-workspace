// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RightSidebar } from "./RightSidebar";

describe("RightSidebar", () => {
  it("loads ask-your-vault only when its feature is enabled", async () => {
    const onAskVault = vi.fn().mockResolvedValue({ answer: "Answer", retrieved: [], citations: [] });
    render(<RightSidebar graph={null} activePath={null} onSelectNote={vi.fn()} askVaultEnabled onAskVault={onAskVault} />);
    expect(await screen.findByRole("heading", { name: "Ask your vault" })).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Question" }), { target: { value: "What changed?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => expect(onAskVault).toHaveBeenCalledWith("What changed?"));
  });

  it("does not render ask-your-vault when the feature is disabled", () => {
    render(<RightSidebar graph={null} activePath={null} onSelectNote={vi.fn()} />);
    expect(screen.queryByRole("heading", { name: "Ask your vault" })).toBeNull();
  });
});
