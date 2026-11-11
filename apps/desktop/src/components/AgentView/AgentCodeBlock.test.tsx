// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentCodeBlock } from "./AgentCodeBlock";

describe("AgentCodeBlock", () => {
  it("renders code and language", () => {
    render(<AgentCodeBlock code="const a = 10;" lang="typescript" />);
    expect(screen.getByText("typescript")).toBeTruthy();
    expect(screen.getByText("const a = 10;")).toBeTruthy();
  });

  it("copies code on click", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<AgentCodeBlock code="echo hello" lang="bash" />);
    const copyBtn = screen.getByRole("button", { name: "Copy code" });
    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalledWith("echo hello");
  });
});
