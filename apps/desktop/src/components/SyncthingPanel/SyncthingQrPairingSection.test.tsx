// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SyncthingQrPairingSection } from "./SyncthingQrPairingSection";

describe("SyncthingQrPairingSection", () => {
  const dummyQr = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  it("renders nothing when qrDataUrl is null", () => {
    const { container } = render(
      <SyncthingQrPairingSection
        qrDataUrl={null}
        pairingCode=""
        secondsLeft={300}
        isExpired={false}
        isGenerating={false}
        onRotateCode={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders countdown, formatted code, and QR image during active window", () => {
    render(
      <SyncthingQrPairingSection
        qrDataUrl={dummyQr}
        pairingCode="482910"
        secondsLeft={285}
        isExpired={false}
        isGenerating={false}
        onRotateCode={() => {}}
      />,
    );

    expect(screen.getByText("Waiting for phone...")).toBeDefined();
    expect(screen.getByText("Window: 04:45")).toBeDefined();
    expect(screen.getByTestId("pairing-code").textContent).toContain("482 910");
    expect(screen.getByTestId("syncthing-qr-image")).toBeDefined();
  });

  it("shows expired badge when window expires", () => {
    render(
      <SyncthingQrPairingSection
        qrDataUrl={dummyQr}
        pairingCode="482910"
        secondsLeft={0}
        isExpired={true}
        isGenerating={false}
        onRotateCode={() => {}}
      />,
    );

    expect(screen.getByText("Code Expired")).toBeDefined();
  });

  it("calls onRotateCode when rotate button is clicked", () => {
    const onRotate = vi.fn();
    render(
      <SyncthingQrPairingSection
        qrDataUrl={dummyQr}
        pairingCode="482910"
        secondsLeft={120}
        isExpired={false}
        isGenerating={false}
        onRotateCode={onRotate}
      />,
    );

    const rotateBtn = screen.getByRole("button", { name: "Rotate pairing code" });
    fireEvent.click(rotateBtn);
    expect(onRotate).toHaveBeenCalledTimes(1);
  });
});
