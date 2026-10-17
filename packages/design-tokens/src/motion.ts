export interface MotionDurationTokens {
  readonly fast: string;
  readonly base: string;
  readonly slow: string;
}

export interface MotionEaseTokens {
  readonly standard: string;
}

export interface MotionTokens {
  readonly duration: MotionDurationTokens;
  readonly ease: MotionEaseTokens;
}

export const motionDurationTokens: MotionDurationTokens = {
  fast: "100ms",
  base: "180ms",
  slow: "300ms",
} as const;

export const motionEaseTokens: MotionEaseTokens = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

export const motionTokens: MotionTokens = {
  duration: motionDurationTokens,
  ease: motionEaseTokens,
} as const;
