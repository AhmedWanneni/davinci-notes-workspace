// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentPromptMenu } from "./AgentPromptMenu";

describe("AgentPromptMenu", () => {
  it("renders when open and triggers upload callback", () => {
    const onUploadFiles = vi.fn();
    const onClose = vi.fn();
    render(
      <AgentPromptMenu
        isOpen={true}
        onClose={onClose}
        onUploadFiles={onUploadFiles}
        onTakeScreenshot={vi.fn()}
        onSelectPrompt={vi.fn()}
        webSearchEnabled={false}
        onToggleWebSearch={vi.fn()}
      />,
    );

    const uploadBtn = screen.getByRole("button", {
      name: /upload or add files/i,
    });
    expect(uploadBtn).toBeTruthy();
    fireEvent.click(uploadBtn);
    expect(onUploadFiles).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("triggers screenshot callback", () => {
    const onTakeScreenshot = vi.fn();
    render(
      <AgentPromptMenu
        isOpen={true}
        onClose={vi.fn()}
        onUploadFiles={vi.fn()}
        onTakeScreenshot={onTakeScreenshot}
        onSelectPrompt={vi.fn()}
        webSearchEnabled={false}
        onToggleWebSearch={vi.fn()}
      />,
    );

    const screenshotBtn = screen.getByRole("button", {
      name: /take a screenshot/i,
    });
    fireEvent.click(screenshotBtn);
    expect(onTakeScreenshot).toHaveBeenCalledTimes(1);
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <AgentPromptMenu
        isOpen={false}
        onClose={vi.fn()}
        onUploadFiles={vi.fn()}
        onTakeScreenshot={vi.fn()}
        onSelectPrompt={vi.fn()}
        webSearchEnabled={false}
        onToggleWebSearch={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("opens prompt templates submenu and selects a prompt template", () => {
    const onSelectPrompt = vi.fn();
    const onClose = vi.fn();
    render(
      <AgentPromptMenu
        isOpen={true}
        onClose={onClose}
        onUploadFiles={vi.fn()}
        onTakeScreenshot={vi.fn()}
        onSelectPrompt={onSelectPrompt}
        webSearchEnabled={false}
        onToggleWebSearch={vi.fn()}
      />,
    );

    const templatesBtn = screen.getByRole("button", {
      name: /prompt templates/i,
    });
    fireEvent.click(templatesBtn);

    expect(screen.getByText("Vault Prompt Templates")).toBeTruthy();
    const item = screen.getByText("Synthesize Project Wiki Note");
    fireEvent.click(item);
    expect(onSelectPrompt).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("renders project variant with focused items: attach file, screenshot, prompts, skills", () => {
    const { container } = render(
      <AgentPromptMenu
        isOpen={true}
        onClose={vi.fn()}
        onUploadFiles={vi.fn()}
        onTakeScreenshot={vi.fn()}
        onSelectPrompt={vi.fn()}
        webSearchEnabled={false}
        onToggleWebSearch={vi.fn()}
        variant="project"
      />,
    );

    expect(screen.getByText("Attach files")).toBeTruthy();
    expect(screen.getByText("Take a screenshot")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^prompts/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^skills/i })).toBeTruthy();
    expect(screen.getByText("Browse All in Library →")).toBeTruthy();

    // Standard options should not be present in project variant
    expect(screen.queryByText("Add to project")).toBeNull();
    expect(screen.queryByText("Add connector")).toBeNull();
    expect(screen.queryByText("Design system")).toBeNull();
    expect(screen.queryByText("Add plugins")).toBeNull();

    // Project variant defaults to bottom placement
    expect((container.firstChild as HTMLElement).className).toMatch(
      /is-placement-bottom/,
    );
  });
});
