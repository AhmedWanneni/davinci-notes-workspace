// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { VisualizerControls } from "./VisualizerControls";

describe("VisualizerControls", () => {
  it("renders record button when idle", () => {
    const onStart = vi.fn();
    render(
      <VisualizerControls
        status="idle"
        isRecording={false}
        isPaused={false}
        isLive={false}
        onStart={onStart}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onStop={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    const recordBtn = screen.getByTestId("start-recording-btn");
    expect(recordBtn).toBeDefined();
    fireEvent.click(recordBtn);
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("renders pause, stop, discard buttons when recording", () => {
    const onPause = vi.fn();
    const onStop = vi.fn();
    const onDiscard = vi.fn();
    render(
      <VisualizerControls
        status="recording"
        isRecording={true}
        isPaused={false}
        isLive={true}
        onStart={vi.fn()}
        onPause={onPause}
        onResume={vi.fn()}
        onStop={onStop}
        onDiscard={onDiscard}
      />,
    );

    const pauseBtn = screen.getByTestId("pause-recording-btn");
    expect(pauseBtn).toBeDefined();
    fireEvent.click(pauseBtn);
    expect(onPause).toHaveBeenCalledOnce();

    const stopBtn = screen.getByTestId("stop-recording-btn");
    fireEvent.click(stopBtn);
    expect(onStop).toHaveBeenCalledOnce();

    const discardBtn = screen.getByTestId("discard-recording-btn");
    fireEvent.click(discardBtn);
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it("renders resume button when paused", () => {
    const onResume = vi.fn();
    render(
      <VisualizerControls
        status="paused"
        isRecording={false}
        isPaused={true}
        isLive={true}
        onStart={vi.fn()}
        onPause={vi.fn()}
        onResume={onResume}
        onStop={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    const resumeBtn = screen.getByTestId("resume-recording-btn");
    expect(resumeBtn).toBeDefined();
    fireEvent.click(resumeBtn);
    expect(onResume).toHaveBeenCalledOnce();
  });
});
