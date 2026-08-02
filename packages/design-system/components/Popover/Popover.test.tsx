import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover, PopoverTrigger, PopoverContent } from "./Popover";

describe("Popover", () => {
  it("does not render content until the trigger is activated", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Panel body</PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText("Panel body")).toBeNull();
  });

  it("opens on trigger click and closes on outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Panel body</PopoverContent>
        </Popover>
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByText("Open"));

    await waitFor(() => {
      expect(screen.getByText("Panel body")).toBeDefined();
    });

    await user.click(screen.getByText("Outside"));

    await waitFor(() => {
      expect(screen.queryByText("Panel body")).toBeNull();
    });
  });
});
