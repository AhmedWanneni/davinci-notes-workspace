// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentMarkdownContent } from "./AgentMarkdownContent";

// Mock @app/editor's registerWidgetMount
vi.mock("@app/editor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@app/editor")>();
  return {
    ...actual,
    registerWidgetMount: vi.fn((container: HTMLElement, id: string) => {
      container.innerHTML = `<iframe class="cm-widget-iframe" data-mock-id="${id}"></iframe>`;
      return () => {
        container.innerHTML = "";
      };
    }),
  };
});

describe("AgentMarkdownContent widget rendering and streaming placeholder", () => {
  it("renders a placeholder while message is streaming and does not mount iframe", () => {
    const content =
      "Here is the chart:\n\n```widget\n<svg><circle r='20'/></svg>\n```\n\nHope this helps!";
    const { container } = render(
      <AgentMarkdownContent content={content} isStreaming={true} />,
    );

    // Placeholder must be visible
    expect(screen.getByText("Generating interactive widget...")).toBeTruthy();
    // Iframe must not be mounted
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("renders a placeholder for unterminated widget block while streaming", () => {
    const unterminated = "Explaining orbits:\n\n```widget\n<canvas id='orbit'>";
    const { container } = render(
      <AgentMarkdownContent content={unterminated} isStreaming={true} />,
    );

    expect(screen.getByText("Generating interactive widget...")).toBeTruthy();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("mounts the widget block once streaming completes", () => {
    const content =
      "Here is the pendulum:\n\n```widget\n<div id='pendulum'>Pendulum</div>\n```";
    const { container } = render(
      <AgentMarkdownContent content={content} isStreaming={false} />,
    );

    expect(screen.queryByText("Generating interactive widget...")).toBeNull();
    expect(screen.getByText("Widget")).toBeTruthy();
    expect(screen.getByText("Source")).toBeTruthy();
    expect(container.querySelector("iframe")).not.toBeNull();
  });

  it("allows toggling to Source tab to view raw widget code", () => {
    const widgetCode = "<svg width='100'><rect width='50' height='50'/></svg>";
    const content = `\`\`\`widget\n${widgetCode}\n\`\`\``;
    render(<AgentMarkdownContent content={content} isStreaming={false} />);

    const sourceTab = screen.getByText("Source");
    fireEvent.click(sourceTab);

    expect(screen.getByText(widgetCode)).toBeTruthy();
  });
});
