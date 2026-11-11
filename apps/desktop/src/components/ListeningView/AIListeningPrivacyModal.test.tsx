// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AIListeningPrivacyModal } from "./AIListeningPrivacyModal";

describe("AIListeningPrivacyModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <AIListeningPrivacyModal
        isOpen={false}
        provider="gemini"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows strong privacy warning for Google Gemini", () => {
    render(
      <AIListeningPrivacyModal
        isOpen={true}
        provider="gemini"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/Google Gemini free tier may process meeting transcripts/i)).toBeTruthy();
    expect(screen.getByText(/Active Provider:/i)).toBeTruthy();
  });

  it("shows local statement for Ollama", () => {
    render(
      <AIListeningPrivacyModal
        isOpen={true}
        provider="ollama"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/Ollama runs locally on your machine/i)).toBeTruthy();
  });

  it("triggers onConfirm when Enable button is clicked", () => {
    const handleConfirm = vi.fn();
    render(
      <AIListeningPrivacyModal
        isOpen={true}
        provider="gemini"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId("privacy-confirm-btn"));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("triggers onCancel when Cancel button is clicked", () => {
    const handleCancel = vi.fn();
    render(
      <AIListeningPrivacyModal
        isOpen={true}
        provider="gemini"
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />,
    );
    fireEvent.click(screen.getByTestId("privacy-cancel-btn"));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
