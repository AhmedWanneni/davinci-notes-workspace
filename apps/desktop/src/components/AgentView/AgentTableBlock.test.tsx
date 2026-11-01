// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentTableBlock } from "./AgentTableBlock";

describe("AgentTableBlock", () => {
  it("renders table headers and rows", () => {
    const tableMd =
      "| Name | Price |\n| --- | --- |\n| Phone | $299 |\n| Laptop | $899 |";
    render(<AgentTableBlock markdownTable={tableMd} />);

    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Price")).toBeTruthy();
    expect(screen.getByText("Phone")).toBeTruthy();
    expect(screen.getByText("$299")).toBeTruthy();
  });

  it("copies table on button click", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const tableMd = "| A | B |\n| - | - |\n| 1 | 2 |";
    render(<AgentTableBlock markdownTable={tableMd} />);

    const copyBtn = screen.getByRole("button", { name: "Copy markdown table" });
    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalledWith(tableMd);
  });
});
