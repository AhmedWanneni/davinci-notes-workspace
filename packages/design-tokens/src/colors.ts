export interface ColorBgTokens {
  readonly primary: string;
  readonly "primary-alt": string;
  readonly secondary: string;
  readonly "secondary-alt": string;
  readonly scrim: string;
  readonly "status-accent": string;
  readonly "status-success": string;
  readonly "status-warning": string;
  readonly "status-error": string;
  readonly hover: string;
  readonly active: string;
}

export interface ColorTextTokens {
  readonly normal: string;
  readonly muted: string;
  readonly faint: string;
  readonly accent: string;
  readonly "on-accent": string;
  readonly error: string;
  readonly success: string;
  readonly warning: string;
}

export interface ColorBorderTokens {
  readonly subtle: string;
  readonly normal: string;
  readonly focus: string;
  readonly "status-accent": string;
  readonly "status-success": string;
  readonly "status-warning": string;
  readonly "status-error": string;
}

export interface ColorInteractiveTokens {
  readonly accent: string;
  readonly "accent-hover": string;
  readonly "accent-active": string;
}

export interface ColorTokens {
  readonly bg: ColorBgTokens;
  readonly text: ColorTextTokens;
  readonly border: ColorBorderTokens;
  readonly interactive: ColorInteractiveTokens;
  readonly shadow: string;
}

export const colorTokens: ColorTokens = {
  bg: {
    primary: "#ffffff",
    "primary-alt": "#f6f6f6",
    secondary: "#f6f6f6",
    "secondary-alt": "#f6f6f6",
    scrim: "rgb(0 0 0 / 25%)",
    "status-accent": "rgb(127 109 242 / 12%)",
    "status-success": "rgb(46 204 113 / 12%)",
    "status-warning": "rgb(241 196 15 / 12%)",
    "status-error": "rgb(229 83 83 / 12%)",
    hover: "rgba(0, 0, 0, 0.05)",
    active: "rgba(0, 0, 0, 0.08)",
  },
  text: {
    normal: "#222222",
    muted: "#5c5c5c",
    faint: "#ababab",
    accent: "#7f6df2",
    "on-accent": "#ffffff",
    error: "#e55353",
    success: "#2ecc71",
    warning: "#f1c40f",
  },
  border: {
    subtle: "#e4e4e4",
    normal: "#d4d4d4",
    focus: "#7f6df2",
    "status-accent": "rgb(127 109 242 / 30%)",
    "status-success": "rgb(46 204 113 / 30%)",
    "status-warning": "rgb(241 196 15 / 30%)",
    "status-error": "rgb(229 83 83 / 30%)",
  },
  interactive: {
    accent: "#7f6df2",
    "accent-hover": "#8d7cf4",
    "accent-active": "#6c5ce7",
  },
  shadow: "rgb(0 0 0 / 12%)",
} as const;

export const darkColorTokens: ColorTokens = {
  bg: {
    primary: "#1e1e1e",
    "primary-alt": "#161616",
    secondary: "#262626",
    "secondary-alt": "#202020",
    scrim: "rgb(0 0 0 / 60%)",
    "status-accent": "rgb(127 109 242 / 15%)",
    "status-success": "rgb(46 204 113 / 15%)",
    "status-warning": "rgb(241 196 15 / 15%)",
    "status-error": "rgb(229 83 83 / 15%)",
    hover: "rgba(255, 255, 255, 0.05)",
    active: "rgba(255, 255, 255, 0.08)",
  },
  text: {
    normal: "#dcddde",
    muted: "#888888",
    faint: "#555555",
    accent: "#7f6df2",
    "on-accent": "#ffffff",
    error: "#e55353",
    success: "#2ecc71",
    warning: "#f1c40f",
  },
  border: {
    subtle: "#2e2e2e",
    normal: "#363636",
    focus: "#7f6df2",
    "status-accent": "rgb(127 109 242 / 30%)",
    "status-success": "rgb(46 204 113 / 30%)",
    "status-warning": "rgb(241 196 15 / 30%)",
    "status-error": "rgb(229 83 83 / 30%)",
  },
  interactive: {
    accent: "#7f6df2",
    "accent-hover": "#8d7cf4",
    "accent-active": "#6c5ce7",
  },
  shadow: "rgb(0 0 0)",
} as const;
