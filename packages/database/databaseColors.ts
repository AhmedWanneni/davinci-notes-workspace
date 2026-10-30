export const NOTION_PASTEL_COLORS: Record<string, { bg: string; color: string }> = {
  green: { bg: "#edf7ee", color: "#1e7e34" },
  orange: { bg: "#faece5", color: "#d9730d" },
  blue: { bg: "#e8f0fe", color: "#1a73e8" },
  red: { bg: "#fde8e8", color: "#c5221f" },
  yellow: { bg: "#fef7e0", color: "#b45309" },
  purple: { bg: "#f3e8fd", color: "#7e22ce" },
  pink: { bg: "#fce8f3", color: "#be185d" },
  gray: { bg: "#f1f1ef", color: "#5f5e5b" },
};

export function getSelectPillStyle(colorKey?: string): {
  backgroundColor: string;
  color: string;
} {
  const key = colorKey?.toLowerCase() || "gray";
  const pastel = NOTION_PASTEL_COLORS[key] ?? NOTION_PASTEL_COLORS.gray;
  return { backgroundColor: pastel.bg, color: pastel.color };
}
