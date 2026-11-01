// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentMermaidBlock } from "./AgentMermaidBlock";

vi.mock("@app/editor", () => ({
  renderMermaidSvg: vi
    .fn()
    .mockResolvedValue("<svg><text>Flowchart</text></svg>"),
}));

describe("AgentMermaidBlock", () => {
  it("renders diagram and allows switching to source", () => {
    const { container } = render(
      <AgentMermaidBlock source={"graph TD\nA-->B"} />,
    );
    expect(screen.getByRole("button", { name: "Diagram" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Source" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Source" }));
    expect(container.querySelector("code")?.textContent).toBe(
      "graph TD\nA-->B",
    );
  });

  it("copies source code on button click", () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<AgentMermaidBlock source="graph LR" />);
    const copyBtn = screen.getByRole("button", { name: "Copy code" });
    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalledWith("graph LR");
  });
});
