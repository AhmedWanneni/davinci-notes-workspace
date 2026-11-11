// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SyncthingConnectOptions } from "./SyncthingConnectOptions";

describe("SyncthingConnectOptions", () => {
  it("shows mobile before desktop and opens each connection dialog", () => {
    render(
      <SyncthingConnectOptions
        mobileContent={<div>Mobile QR content</div>}
        desktopContent={<div>Desktop ID form</div>}
      />,
    );

    const connectButtons = screen.getAllByRole("button", { name: /Connect/ });
    expect(screen.getByText("Connect mobile")).toBeDefined();
    expect(screen.getByText("Connect desktop")).toBeDefined();
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(connectButtons[0]);
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Mobile QR content")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Close connection dialog" }));
    fireEvent.click(screen.getAllByRole("button", { name: /Connect/ })[1]);
    expect(screen.getByText("Desktop ID form")).toBeDefined();
  });
});
