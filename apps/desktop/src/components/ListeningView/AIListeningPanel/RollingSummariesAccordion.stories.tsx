import type { Meta, StoryObj } from "@storybook/react";
import { RollingSummariesAccordion } from "./RollingSummariesAccordion";

const meta: Meta<typeof RollingSummariesAccordion> = {
  title: "ListeningView/RollingSummariesAccordion",
  component: RollingSummariesAccordion,
};

export default meta;
type Story = StoryObj<typeof RollingSummariesAccordion>;

export const Default: Story = {
  args: {
    summaries: [
      {
        id: "1",
        timeRange: "00:00 - 02:00",
        timestampMs: 120000,
        summary: "Introduction of team members and review of previous sprint items.",
      },
      {
        id: "2",
        timeRange: "02:00 - 04:00",
        timestampMs: 240000,
        summary: "Technical architectural discussion on SQLite indexing and locking rules.",
      },
    ],
    activeSummary: "Technical architectural discussion on SQLite indexing and locking rules.",
    isSummarizing: false,
    interval: "2m",
    isPaused: false,
  },
};

export const SummarizingNow: Story = {
  args: {
    summaries: [
      {
        id: "1",
        timeRange: "00:00 - 02:00",
        timestampMs: 120000,
        summary: "Sprint objectives established.",
      },
    ],
    activeSummary: "Synthesizing live discussion...",
    isSummarizing: true,
    interval: "2m",
    isPaused: false,
  },
};

export const Paused: Story = {
  args: {
    summaries: [],
    activeSummary: "",
    isSummarizing: false,
    interval: "2m",
    isPaused: true,
  },
};
