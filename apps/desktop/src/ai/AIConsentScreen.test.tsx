// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AIConsentScreen } from "./AIConsentScreen";

describe("AIConsentScreen", () => {
  it("names the provider and explains the data flow", () => {
    render(<AIConsentScreen providerName="Example Cloud" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/Example Cloud/)).toBeTruthy();
    expect(screen.getByText(/selected note excerpts/)).toBeTruthy();
    expect(screen.getByText(/Ollama is available separately/)).toBeTruthy();
  });

  it("requires an explicit confirmation action", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<AIConsentScreen providerName="Example Cloud" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Enable cloud AI" }));
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
