// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentCliStatusCard } from "./AgentCliStatusCard";

describe("AgentCliStatusCard", () => {
  it("renders agent name and running badge", () => {
    render(
      <AgentCliStatusCard
        agentName="Antigravity CLI (agy)"
        status="running"
        logs={["⚡ Scanning vault tree...", "Writing Projects/Roadmap.md"]}
      />,
    );

    expect(screen.getByText("Antigravity CLI (agy)")).toBeDefined();
    expect(screen.getByText("RUNNING")).toBeDefined();
    expect(screen.getByText("⚡ Scanning vault tree...")).toBeDefined();
    expect(screen.getByText("Writing Projects/Roadmap.md")).toBeDefined();
  });

  it("handles stop button click when running", () => {
    const onCancel = vi.fn();
    render(
      <AgentCliStatusCard
        agentName="Claude Code"
        status="running"
        logs={["Thinking..."]}
        onCancel={onCancel}
      />,
    );

    const stopBtn = screen.getByText("Stop");
    fireEvent.click(stopBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("displays done status badge", () => {
    render(
      <AgentCliStatusCard
        agentName="Codex CLI"
        status="done"
        logs={["Execution completed."]}
      />,
    );

    expect(screen.getByText("COMPLETE")).toBeDefined();
    expect(screen.queryByText("Stop")).toBeNull();
  });

  it("displays error status badge", () => {
    render(
      <AgentCliStatusCard
        agentName="OpenCode"
        status="error"
        logs={["Process exited with error."]}
      />,
    );

    expect(screen.getByText("ERROR")).toBeDefined();
  });
});
