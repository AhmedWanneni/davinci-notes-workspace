// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentExecutionLogs } from "./AgentExecutionLogs";

describe("AgentExecutionLogs", () => {
  it("renders nothing when logs array is empty", () => {
    const { container } = render(<AgentExecutionLogs logs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders collapsed header and toggles log details on click", () => {
    const logs = [
      "Analyzing request...",
      "Calling tool list_notes...",
      "Done.",
    ];
    render(<AgentExecutionLogs logs={logs} defaultOpen={false} />);

    expect(screen.getByText(/Activity \(3 events\)/i)).toBeTruthy();
    expect(screen.queryByText("Calling tool list_notes...")).toBeNull();

    const toggleBtn = screen.getByRole("button", { name: /Activity/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText("Analyzing request...")).toBeTruthy();
    expect(screen.getByText("Calling tool list_notes...")).toBeTruthy();
    expect(screen.getByText("Done.")).toBeTruthy();
  });

  it("displays latest activity and stays open when streaming", () => {
    const logs = ["Analyzing request...", "Generating stream response..."];
    render(<AgentExecutionLogs logs={logs} isStreaming={true} />);

    expect(
      screen.getByText(/Activity: Generating stream response\.\.\./i),
    ).toBeTruthy();
    expect(screen.getByText("Analyzing request...")).toBeTruthy();
  });
});
