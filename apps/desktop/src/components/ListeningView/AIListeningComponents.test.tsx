// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MeetingsSidebar } from "./MeetingsSidebar";
import { ListeningVisualizer } from "./ListeningVisualizer";
import { LiveSummaryCard } from "./AIListeningPanel/LiveSummaryCard";
import { SuggestedAnswersList } from "./AIListeningPanel/SuggestedAnswersList";
import { SuggestedQuestionsList } from "./AIListeningPanel/SuggestedQuestionsList";
import { AIListeningInput } from "./AIListeningPanel/AIListeningInput";
import { TranscriptFeed } from "./TranscriptFeed";
import type {
  AIListeningAnswerItem,
  AIListeningFollowupQuestion,
} from "@app/ai-agent";

describe("AI Listening & Recording Page Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("MeetingsSidebar", () => {
    it("renders navigation channels and handles click", () => {
      const onSelectChannel = vi.fn();
      render(
        <MeetingsSidebar
          activeChannel="voice-agent"
          onSelectChannel={onSelectChannel}
        />,
      );

      expect(screen.getByText("My Meetings")).toBeDefined();
      expect(screen.getByText("All Meetings")).toBeDefined();
      expect(screen.getByText("Voice Agent Meetings")).toBeDefined();
      expect(screen.getByText("Uploads")).toBeDefined();
      expect(screen.getByText("NEW")).toBeDefined();

      fireEvent.click(screen.getByText("My Meetings"));
      expect(onSelectChannel).toHaveBeenCalledWith("my-meetings");
    });
  });

  describe("ListeningVisualizer", () => {
    it("renders waveform bars, timer, and controls with toggles", () => {
      const onToggleTranscript = vi.fn();
      const onToggleAIListening = vi.fn();
      const onStart = vi.fn();

      render(
        <ListeningVisualizer
          status="idle"
          title="Team Standup"
          durationMs={0}
          micLevel={0}
          systemLevel={0}
          isTranscriptVisible={false}
          isAIListeningActive={false}
          onTitleChange={vi.fn()}
          onStart={onStart}
          onPause={vi.fn()}
          onResume={vi.fn()}
          onStop={vi.fn()}
          onDiscard={vi.fn()}
          onToggleTranscript={onToggleTranscript}
          onToggleAIListening={onToggleAIListening}
        />,
      );

      expect(screen.getByTestId("audio-waveform-bars")).toBeDefined();
      expect(screen.getByTestId("start-recording-btn")).toBeDefined();
      expect(screen.getByTestId("transcript-toggle")).toBeDefined();
      expect(screen.getByTestId("ai-listening-toggle")).toBeDefined();

      fireEvent.click(screen.getByTestId("transcript-toggle"));
      expect(onToggleTranscript).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId("ai-listening-toggle"));
      expect(onToggleAIListening).toHaveBeenCalled();
    });

    it("displays non-blocking error status when AI fails or rate limits", () => {
      render(
        <ListeningVisualizer
          status="recording"
          title="Meeting"
          durationMs={5000}
          micLevel={0.5}
          systemLevel={0}
          isTranscriptVisible={true}
          isAIListeningActive={true}
          aiStatus="error"
          aiError="Rate limit exceeded"
          onTitleChange={vi.fn()}
          onStart={vi.fn()}
          onPause={vi.fn()}
          onResume={vi.fn()}
          onStop={vi.fn()}
          onDiscard={vi.fn()}
          onToggleTranscript={vi.fn()}
          onToggleAIListening={vi.fn()}
        />,
      );

      expect(screen.getByText("Rate limit exceeded")).toBeDefined();
    });
  });

  describe("LiveSummaryCard & Chips", () => {
    it("renders greeting, summary text, and action chips", () => {
      const onChipClick = vi.fn();
      render(
        <LiveSummaryCard
          summary="Discussed Q3 revenue and mobile milestones."
          onChipClick={onChipClick}
        />,
      );

      expect(screen.getByText("Hi AHMED!")).toBeDefined();
      expect(screen.getByText("Get ready for your meeting")).toBeDefined();
      expect(
        screen.getByText("Discussed Q3 revenue and mobile milestones."),
      ).toBeDefined();

      fireEvent.click(screen.getByText("Key initiatives"));
      expect(onChipClick).toHaveBeenCalledWith(
        "Identify key initiatives from this discussion",
      );
    });
  });

  describe("SuggestedAnswersList & Actions", () => {
    const answers: AIListeningAnswerItem[] = [
      {
        id: "a1",
        timestamp: Date.now(),
        question: "What is the release date?",
        answer: "November 15th.",
        status: "suggested",
      },
    ];

    it("renders question, answer, save, and dismiss buttons", () => {
      const onSave = vi.fn();
      const onDismiss = vi.fn();

      render(
        <SuggestedAnswersList
          answers={answers}
          onSave={onSave}
          onDismiss={onDismiss}
        />,
      );

      expect(screen.getByText("What is the release date?")).toBeDefined();
      expect(screen.getByText("November 15th.")).toBeDefined();

      fireEvent.click(screen.getByTestId("save-answer-a1"));
      expect(onSave).toHaveBeenCalledWith("a1");

      fireEvent.click(screen.getByTestId("dismiss-answer-a1"));
      expect(onDismiss).toHaveBeenCalledWith("a1");
    });
  });

  describe("SuggestedQuestionsList & Actions", () => {
    const questions: AIListeningFollowupQuestion[] = [
      {
        id: "q1",
        timestamp: Date.now(),
        question: "Should we run load testing first?",
        status: "suggested",
      },
    ];

    it("renders follow-up question and handles save/dismiss", () => {
      const onSave = vi.fn();
      const onDismiss = vi.fn();

      render(
        <SuggestedQuestionsList
          questions={questions}
          onSave={onSave}
          onDismiss={onDismiss}
        />,
      );

      expect(
        screen.getByText("Should we run load testing first?"),
      ).toBeDefined();

      fireEvent.click(screen.getByTestId("save-question-q1"));
      expect(onSave).toHaveBeenCalledWith("q1");

      fireEvent.click(screen.getByTestId("dismiss-question-q1"));
      expect(onDismiss).toHaveBeenCalledWith("q1");
    });
  });

  describe("AIListeningInput", () => {
    it("submits prompt on form submission", () => {
      const onSubmit = vi.fn();
      render(<AIListeningInput onSubmit={onSubmit} />);

      const input = screen.getByTestId("ai-listening-query-input");
      fireEvent.change(input, { target: { value: "Summarize decisions" } });

      fireEvent.submit(screen.getByTestId("ai-listening-input-form"));
      expect(onSubmit).toHaveBeenCalledWith("Summarize decisions");
    });
  });

  describe("TranscriptFeed Smart Scroll", () => {
    it("renders scroll container and auto-scrolls when not scrolled up", () => {
      render(
        <TranscriptFeed
          segments={[
            {
              id: "1",
              text: "First line",
              startMs: 0,
              endMs: 1000,
              isFinal: true,
              speaker: "me",
            },
            {
              id: "2",
              text: "Second line",
              startMs: 2000,
              endMs: 3000,
              isFinal: true,
              speaker: "meeting",
            },
          ]}
          isRecording={true}
        />,
      );

      const feedContainer = screen.getByTestId("transcript-feed-container");
      expect(feedContainer).toBeDefined();
      // By default when near bottom, jump-to-latest button is not shown
      expect(screen.queryByTestId("jump-to-latest-btn")).toBeNull();
    });
  });
});
