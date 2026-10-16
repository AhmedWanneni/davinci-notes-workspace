export interface HeadingSpec {
  readonly size: string;
  readonly weight: string;
  readonly lineHeight: string;
  readonly spaceAbove?: string;
  readonly spaceBelow?: string;
}

export interface EditorTokens {
  readonly lineHeight: string;
  readonly contentPaddingX: string;
  readonly contentPaddingY: string;
  readonly contentPaddingBottom: string;
  readonly heading: {
    readonly h1: HeadingSpec;
    readonly h2: HeadingSpec;
    readonly h3: HeadingSpec;
    readonly h4: HeadingSpec;
    readonly h5: HeadingSpec;
    readonly h6: HeadingSpec;
  };
  readonly code: {
    readonly paddingX: string;
    readonly radius: string;
    readonly blockPaddingY: string;
  };
  readonly listIndent: string;
  readonly obsidian: {
    readonly bodyFontSize: string;
    readonly bodyLineHeight: string;
    readonly contentMaxWidth: string;
    readonly contentLinePaddingInline: string;
    readonly heading: {
      readonly h1: HeadingSpec;
      readonly h2: HeadingSpec;
      readonly h3: HeadingSpec;
      readonly h4: HeadingSpec;
      readonly h5: HeadingSpec;
      readonly h6: HeadingSpec;
    };
    readonly spacing: {
      readonly paragraphLivePreview: string;
      readonly paragraphSourceMode: string;
      readonly list: string;
    };
    readonly color: {
      readonly markdownMarker: string;
      readonly link: string;
      readonly tag: string;
      readonly tagBackground: string;
      readonly tagBackgroundMobile: string;
    };
  };
}

export const editorTokens: EditorTokens = {
  lineHeight: "1.65",
  contentPaddingX: "clamp(1rem, 4vw, 3rem)",
  contentPaddingY: "1.5rem",
  contentPaddingBottom: "30vh",
  heading: {
    h1: {
      size: "1.6em",
      weight: "700",
      lineHeight: "1.25",
      spaceAbove: "1.2em",
      spaceBelow: "0.3em",
    },
    h2: {
      size: "1.35em",
      weight: "650",
      lineHeight: "1.3",
      spaceAbove: "1em",
      spaceBelow: "0.25em",
    },
    h3: {
      size: "1.15em",
      weight: "600",
      lineHeight: "1.35",
      spaceAbove: "0.9em",
      spaceBelow: "0.2em",
    },
    h4: {
      size: "1.05em",
      weight: "600",
      lineHeight: "1.4",
      spaceAbove: "0.8em",
      spaceBelow: "0.15em",
    },
    h5: {
      size: "1em",
      weight: "600",
      lineHeight: "1.5",
      spaceAbove: "0.7em",
      spaceBelow: "0.1em",
    },
    h6: {
      size: "1em",
      weight: "600",
      lineHeight: "1.5",
      spaceAbove: "0.7em",
      spaceBelow: "0.1em",
    },
  },
  code: {
    paddingX: "0.2em",
    radius: "0.2em",
    blockPaddingY: "0.15em",
  },
  listIndent: "1.5em",
  obsidian: {
    bodyFontSize: "1rem",
    bodyLineHeight: "1.5",
    contentMaxWidth: "43.75rem",
    contentLinePaddingInline: "0",
    heading: {
      h1: { size: "1.618em", weight: "700", lineHeight: "1.2" },
      h2: { size: "1.462em", weight: "680", lineHeight: "1.2" },
      h3: { size: "1.318em", weight: "660", lineHeight: "1.3" },
      h4: { size: "1.188em", weight: "640", lineHeight: "1.4" },
      h5: { size: "1.076em", weight: "620", lineHeight: "1.5" },
      h6: { size: "1em", weight: "600", lineHeight: "1.5" },
    },
    spacing: {
      paragraphLivePreview: "1rem",
      paragraphSourceMode: "0",
      list: "0.075em",
    },
    color: {
      markdownMarker: "#666666",
      link: "hsl(255 89.76% 75.9%)",
      tag: "var(--editor-obsidian-color-link)",
      tagBackground:
        "color-mix(in oklch, var(--editor-obsidian-color-tag) 10%, transparent)",
      tagBackgroundMobile:
        "color-mix(in oklch, var(--editor-obsidian-color-tag) 20%, transparent)",
    },
  },
} as const;
