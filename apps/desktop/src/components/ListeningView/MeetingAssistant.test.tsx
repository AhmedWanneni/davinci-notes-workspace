// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MeetingAssistantPanel } from "./MeetingAssistantPanel";
import type { ParsedMeetingItem } from "./meetingsParser";

const mockMeetings: ParsedMeetingItem[] = [
  {
    path: "Meetings/2026-11-02 - Sprint Planning.md",
    title: "Sprint Planning",
    date: "2026-11-02",
    time: "10:00",
    durationSeconds: 1800,
    summary: "Reviewed sprint deliverables and finalized roadmap.",
    actionItems: ["Deploy mobile release v1.2", "Review token contrast"],
    answers: [{ question: "Is sync ready?", answer: "Yes, ready for QA." }],
    questions: ["What about battery usage?"],
    relatedNotes: [{ title: "Architecture.md" }],
    audioFileName: "sprint.wav",
    transcript: [{ offset: "00:00", speaker: "Alice", text: "Welcome everyone." }],
  },
];

describe("MeetingAssistantPanel", () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("renders Ask Fred header, greeting, and suggestion chips", () => {
    render(
      <MeetingAssistantPanel
        meetings={mockMeetings}
        channelName="All Meetings"
        userName="AHMED"
      />,
    );

    expect(screen.getByText("Ask Fred")).toBeDefined();
    expect(screen.getByText("Hi AHMED!")).toBeDefined();
    expect(screen.getByText("Get ready for your meeting")).toBeDefined();
    expect(screen.getByText("Key initiatives")).toBeDefined();
    expect(screen.getByText("Summarize the channel")).toBeDefined();
    expect(screen.getByText("Product feedback")).toBeDefined();
  });

  it("triggers initiative synthesis when clicking Key initiatives chip", async () => {
    vi.useFakeTimers();
    render(<MeetingAssistantPanel meetings={mockMeetings} />);

    fireEvent.click(screen.getByTestId("chip-key-initiatives"));

    expect(screen.getAllByText("Key initiatives").length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(
      screen.getByText(/Key initiatives identified across your meetings/i),
    ).toBeDefined();
    vi.useRealTimers();
  });

  it("summarizes channel meetings when clicking Summarize chip", async () => {
    vi.useFakeTimers();
    render(<MeetingAssistantPanel meetings={mockMeetings} />);

    fireEvent.click(screen.getByTestId("chip-summarize"));

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(
      screen.getByText(/Summary of your meeting channel/i),
    ).toBeDefined();
    expect(screen.getByText(/Sprint Planning/i)).toBeDefined();
    vi.useRealTimers();
  });

  it("handles user typing and submitting custom queries", async () => {
    vi.useFakeTimers();
    render(<MeetingAssistantPanel meetings={mockMeetings} />);

    const input = screen.getByTestId("ai-listening-query-input");
    fireEvent.change(input, { target: { value: "Tell me about Sprint" } });
    fireEvent.submit(screen.getByTestId("ai-listening-input-form"));

    expect(screen.getByText("Tell me about Sprint")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(
      screen.getByText(/Found relevant notes in/i),
    ).toBeDefined();
    vi.useRealTimers();
  });

  it("clears conversation when clicking new chat button", async () => {
    vi.useFakeTimers();
    render(<MeetingAssistantPanel meetings={mockMeetings} />);

    fireEvent.click(screen.getByTestId("chip-key-initiatives"));
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(
      screen.getByText(/Key initiatives identified across your meetings/i),
    ).toBeDefined();

    fireEvent.click(screen.getByTestId("assistant-new-chat-btn"));

    expect(
      screen.queryByText(/Key initiatives identified across your meetings/i),
    ).toBeNull();
    vi.useRealTimers();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <MeetingAssistantPanel
        meetings={mockMeetings}
        onClose={handleClose}
      />,
    );

    fireEvent.click(screen.getByTestId("assistant-close-btn"));
    expect(handleClose).toHaveBeenCalledOnce();
  });
});
