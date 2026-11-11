// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RollingSummariesAccordion } from "./RollingSummariesAccordion";
import type { RollingSummaryItem } from "../useLiveSummaries";

describe("RollingSummariesAccordion", () => {
  const mockSummaries: RollingSummaryItem[] = [
    {
      id: "sum_1",
      startMs: 0,
      endMs: 120000,
      timeLabel: "00:00 - 02:00",
      text: "First two minutes discussed Q4 objectives.",
      createdAt: 1700000000,
    },
    {
      id: "sum_2",
      startMs: 120000,
      endMs: 240000,
      timeLabel: "02:00 - 04:00",
      text: "Second segment covered budget allocation.",
      createdAt: 1700000120,
    },
  ];

  it("renders summaries list and expands the latest item by default", () => {
    render(
      <RollingSummariesAccordion
        summaries={mockSummaries}
        activeSummary=""
        isSummarizing={false}
        interval="2m"
        isPaused={false}
        onIntervalChange={vi.fn()}
        onSummarizeNow={vi.fn()}
        onTogglePause={vi.fn()}
      />,
    );

    expect(screen.getByText("00:00 - 02:00")).toBeTruthy();
    expect(screen.getByText("02:00 - 04:00")).toBeTruthy();
    expect(screen.getByText("Second segment covered budget allocation.")).toBeTruthy();
    // Older summary is collapsed by default
    expect(screen.queryByText("First two minutes discussed Q4 objectives.")).toBeNull();
  });

  it("allows toggling collapsed summaries to expand them", () => {
    render(
      <RollingSummariesAccordion
        summaries={mockSummaries}
        activeSummary=""
        isSummarizing={false}
        interval="2m"
        isPaused={false}
        onIntervalChange={vi.fn()}
        onSummarizeNow={vi.fn()}
        onTogglePause={vi.fn()}
      />,
    );

    const firstSummaryHeader = screen.getByText("00:00 - 02:00");
    fireEvent.click(firstSummaryHeader);
    expect(screen.getByText("First two minutes discussed Q4 objectives.")).toBeTruthy();
  });

  it("triggers interval change when dropdown option changes", () => {
    const handleIntervalChange = vi.fn();
    render(
      <RollingSummariesAccordion
        summaries={mockSummaries}
        activeSummary=""
        isSummarizing={false}
        interval="2m"
        isPaused={false}
        onIntervalChange={handleIntervalChange}
        onSummarizeNow={vi.fn()}
        onTogglePause={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId("summary-interval-select"), {
      target: { value: "5m" },
    });
    expect(handleIntervalChange).toHaveBeenCalledWith("5m");
  });

  it("triggers summarize now button", () => {
    const handleSummarizeNow = vi.fn();
    render(
      <RollingSummariesAccordion
        summaries={mockSummaries}
        activeSummary=""
        isSummarizing={false}
        interval="2m"
        isPaused={false}
        onIntervalChange={vi.fn()}
        onSummarizeNow={handleSummarizeNow}
        onTogglePause={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("summarize-now-btn"));
    expect(handleSummarizeNow).toHaveBeenCalledTimes(1);
  });

  it("triggers pause/resume toggle", () => {
    const handleTogglePause = vi.fn();
    render(
      <RollingSummariesAccordion
        summaries={mockSummaries}
        activeSummary=""
        isSummarizing={false}
        interval="2m"
        isPaused={false}
        onIntervalChange={vi.fn()}
        onSummarizeNow={vi.fn()}
        onTogglePause={handleTogglePause}
      />,
    );

    fireEvent.click(screen.getByTestId("toggle-pause-ai-btn"));
    expect(handleTogglePause).toHaveBeenCalledTimes(1);
  });
});
