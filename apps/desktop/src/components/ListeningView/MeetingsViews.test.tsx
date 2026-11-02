// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AllMeetingsView } from "./AllMeetingsView";
import { MeetingDetailView } from "./MeetingDetailView";
import { MeetingAudioPlayer } from "./MeetingAudioPlayer";
import type { ParsedMeetingItem } from "./meetingsParser";

describe("AllMeetingsView & MeetingDetailView", () => {
  const sampleMeeting: ParsedMeetingItem = {
    path: "Meetings/2026-11-02 - Roadmap Review.md",
    title: "Roadmap Review",
    date: "2026-11-02",
    time: "10:00",
    durationSeconds: 1200,
    summary: "Reviewed Q4 deliverables and launch schedule.",
    actionItems: ["Finalize security audit"],
    answers: [{ question: "Is staging ready?", answer: "Yes." }],
    questions: ["Who will write release notes?"],
    relatedNotes: [{ title: "Launch Spec", reason: "Release details" }],
    audioFileName: "2026-11-02 - Roadmap Review.wav",
    transcript: [{ offset: "00:00", speaker: "Me", text: "Welcome everyone." }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AllMeetingsView", () => {
    it("renders meeting rows in list view and allows searching", () => {
      const onSelect = vi.fn();
      const onStart = vi.fn();
      render(
        <AllMeetingsView
          meetings={[sampleMeeting]}
          onSelectMeeting={onSelect}
          onStartNewRecording={onStart}
        />,
      );

      expect(screen.getByText("Roadmap Review")).toBeDefined();
      expect(screen.getByText("Reviewed Q4 deliverables and launch schedule.")).toBeDefined();

      const searchInput = screen.getByTestId("meetings-search-input");
      fireEvent.change(searchInput, { target: { value: "Roadmap" } });
      expect(screen.getByText("Roadmap Review")).toBeDefined();

      fireEvent.change(searchInput, { target: { value: "NonExistent" } });
      expect(screen.queryByText("Roadmap Review")).toBeNull();
      expect(screen.getByText("No meetings match your filter")).toBeDefined();
    });

    it("switches to board view when board toggle is clicked", () => {
      render(
        <AllMeetingsView
          meetings={[sampleMeeting]}
          onSelectMeeting={vi.fn()}
          onStartNewRecording={vi.fn()}
        />,
      );

      const boardToggle = screen.getByTestId("view-toggle-board");
      fireEvent.click(boardToggle);

      expect(screen.getByTestId("meetings-board-view")).toBeDefined();
      expect(screen.getByTestId("board-card-Roadmap Review")).toBeDefined();
    });

    it("triggers onOpenSettings when settings icon is clicked", () => {
      const onOpenSettings = vi.fn();
      render(
        <AllMeetingsView
          meetings={[sampleMeeting]}
          onSelectMeeting={vi.fn()}
          onStartNewRecording={vi.fn()}
          onOpenSettings={onOpenSettings}
        />,
      );

      const settingsBtn = screen.getByTestId("meetings-settings-btn");
      fireEvent.click(settingsBtn);
      expect(onOpenSettings).toHaveBeenCalled();
    });
  });

  describe("MeetingDetailView", () => {
    it("renders audio player, executive summary, action items, and Q&A", () => {
      const onBack = vi.fn();
      const onOpenNote = vi.fn();
      render(
        <MeetingDetailView
          meeting={sampleMeeting}
          vaultPath="/Users/user/vault"
          onBack={onBack}
          onOpenNote={onOpenNote}
        />,
      );

      expect(screen.getByText("Roadmap Review")).toBeDefined();
      expect(screen.getByTestId("meeting-audio-player")).toBeDefined();
      expect(screen.getByText("Executive Summary")).toBeDefined();
      expect(screen.getByText("Reviewed Q4 deliverables and launch schedule.")).toBeDefined();
      expect(screen.getByText("Finalize security audit")).toBeDefined();
      expect(screen.getByText("Is staging ready?")).toBeDefined();

      fireEvent.click(screen.getByTestId("detail-back-btn"));
      expect(onBack).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId("open-as-note-btn"));
      expect(onOpenNote).toHaveBeenCalledWith("Meetings/2026-11-02 - Roadmap Review.md");
    });

    it("switches to transcript tab and displays speech blocks", () => {
      render(
        <MeetingDetailView
          meeting={sampleMeeting}
          vaultPath="/Users/user/vault"
          onBack={vi.fn()}
        />,
      );

      const transcriptTab = screen.getByTestId("tab-transcript");
      fireEvent.click(transcriptTab);

      expect(screen.getByTestId("detail-transcript-content")).toBeDefined();
      expect(screen.getByText("Welcome everyone.")).toBeDefined();
      expect(screen.getByText("Me")).toBeDefined();
    });
  });

  describe("MeetingAudioPlayer", () => {
    it("renders play button, time display, and waveform slider", () => {
      render(
        <MeetingAudioPlayer
          audioSrc="asset://vault/attachments/meeting.wav"
          durationSeconds={120}
        />,
      );

      expect(screen.getByTestId("meeting-audio-player")).toBeDefined();
      expect(screen.getByTestId("audio-play-btn")).toBeDefined();
      expect(screen.getByText("02:00")).toBeDefined();
    });
  });
});
