// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GoogleAccountCard } from "./GoogleAccountCard";

describe("GoogleAccountCard", () => {
  it("renders disconnected view and fires connect", () => {
    const onConnect = vi.fn();
    const onClientIdChange = vi.fn();

    render(
      <GoogleAccountCard
        isConnected={false}
        isConnecting={false}
        isLoading={false}
        clientId="my-client-id"
        errorMessage={null}
        onClientIdChange={onClientIdChange}
        onConnect={onConnect}
        onDisconnect={vi.fn()}
      />,
    );

    expect(screen.getByText("Not Connected")).toBeDefined();
    expect(screen.getByTestId("connect-calendar-btn")).toBeDefined();

    const input = screen.getByTestId("calendar-client-id-input");
    expect((input as HTMLInputElement).value).toBe("my-client-id");

    fireEvent.change(input, { target: { value: "new-client-id" } });
    expect(onClientIdChange).toHaveBeenCalledWith("new-client-id");

    fireEvent.click(screen.getByTestId("connect-calendar-btn"));
    expect(onConnect).toHaveBeenCalled();
  });

  it("renders connected view and fires disconnect", () => {
    const onDisconnect = vi.fn();

    render(
      <GoogleAccountCard
        isConnected={true}
        isConnecting={false}
        isLoading={false}
        clientId="my-client-id"
        errorMessage={null}
        onClientIdChange={vi.fn()}
        onConnect={vi.fn()}
        onDisconnect={onDisconnect}
      />,
    );

    expect(screen.getByText("Connected to Google")).toBeDefined();
    expect(screen.queryByTestId("calendar-client-id-input")).toBeNull();

    const disconnectBtn = screen.getByTestId("disconnect-calendar-btn");
    fireEvent.click(disconnectBtn);
    expect(onDisconnect).toHaveBeenCalled();
  });

  it("renders error banner when errorMessage is provided", () => {
    render(
      <GoogleAccountCard
        isConnected={false}
        isConnecting={false}
        isLoading={false}
        clientId=""
        errorMessage="Custom error message"
        onClientIdChange={vi.fn()}
        onConnect={vi.fn()}
        onDisconnect={vi.fn()}
      />,
    );

    expect(screen.getByTestId("calendar-settings-error")).toBeDefined();
    expect(screen.getByText("Custom error message")).toBeDefined();
  });
});
