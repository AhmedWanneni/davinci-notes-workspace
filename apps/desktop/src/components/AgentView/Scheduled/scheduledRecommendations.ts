import type { LocalScheduleSpec } from "./scheduleTime";

export interface ScheduledRecommendation {
  id: string;
  emoji: string;
  title: string;
  description: string;
  prompt: string;
  spec: LocalScheduleSpec;
}

const daily = (time: string): LocalScheduleSpec => ({
  frequency: "daily",
  time,
  dayOfWeek: 1,
  intervalHours: 24,
});

const weekly = (dayOfWeek: number, time: string): LocalScheduleSpec => ({
  frequency: "weekly",
  time,
  dayOfWeek,
  intervalHours: 24,
});

/** Prepared prompts the user can schedule with one click. */
export const SCHEDULED_RECOMMENDATIONS: ScheduledRecommendation[] = [
  {
    id: "news-updates",
    emoji: "📰",
    title: "News updates",
    description: "Send me a daily roundup of news on topics I care about.",
    prompt:
      "Every morning, search the web and give me a short roundup of the most important news on the topics I care about (check my notes for my interests). Use 5–8 bullets with one-line summaries and a source link for each.",
    spec: daily("08:00"),
  },
  {
    id: "outfit-ideas",
    emoji: "👗",
    title: "Outfit ideas",
    description: "Pick an outfit from my clothes for each day's weather.",
    prompt:
      "Every morning, suggest an easy outfit using everyday basics and any style preferences you know. Factor in local weather when available, include one simple swap, and vary the combinations.",
    spec: daily("08:00"),
  },
  {
    id: "what-to-watch",
    emoji: "🎬",
    title: "What to watch",
    description: "Pick three movies or shows for me every Friday night.",
    prompt:
      "Pick three movies or shows for me to watch tonight, based on what I've enjoyed before (check my notes). For each: title, year, where to stream it, and one sentence on why I'd like it.",
    spec: weekly(5, "19:00"),
  },
  {
    id: "learn-language",
    emoji: "🗣️",
    title: "Learn a language",
    description: "Send me a daily lesson at my level, under 10 minutes.",
    prompt:
      "Give me a daily language lesson at my level that takes under 10 minutes: 5 new words with examples, one grammar point, and a short exercise with answers at the end.",
    spec: daily("09:00"),
  },
  {
    id: "plan-workouts",
    emoji: "🏃",
    title: "Plan workouts",
    description: "Plan my week's workouts around my goals and schedule.",
    prompt:
      "Plan my workouts for the coming week around my fitness goals and schedule (check my notes and calendar). Give a day-by-day plan with duration and a short warm-up for each session.",
    spec: weekly(0, "18:00"),
  },
  {
    id: "organize-home",
    emoji: "🏡",
    title: "Organize my home",
    description: "Suggest one 15-minute home task for me each Saturday.",
    prompt:
      "Suggest one home organizing task I can finish in 15 minutes today. Explain the steps briefly and rotate between different rooms and areas each week.",
    spec: weekly(6, "10:00"),
  },
  {
    id: "recommend-book",
    emoji: "📚",
    title: "Recommend a book",
    description: "Pick three books for me each month, based on my tastes.",
    prompt:
      "Pick three books for me based on my reading tastes (check my notes for books I've read or liked). For each: title, author, a one-paragraph pitch, and why it fits me.",
    spec: { frequency: "interval", time: "09:00", dayOfWeek: 1, intervalHours: 720 },
  },
];
