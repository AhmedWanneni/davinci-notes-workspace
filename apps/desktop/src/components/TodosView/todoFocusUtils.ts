export function parseCardEmojiAndTitle(
  rawText: string,
  sectionName: string,
): { emoji: string; title: string; subtitle: string } {
  const emojiMatch = rawText.match(
    /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*(.*)$/u,
  );
  let emoji = "📝";
  let title = rawText;
  if (emojiMatch) {
    emoji = emojiMatch[1];
    title = emojiMatch[2];
  } else {
    const lower = sectionName.toLowerCase();
    if (lower.includes("morning")) emoji = "🧘";
    else if (lower.includes("evening") || lower.includes("night")) emoji = "🌙";
    else if (lower.includes("day") || lower.includes("work")) emoji = "💼";
  }

  let subtitle = "";
  const timeMatch = title.match(
    /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*(?:→|-)\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/,
  );
  if (timeMatch) {
    subtitle = timeMatch[1];
    title = title.replace(timeMatch[0], "").trim();
  }
  return { emoji, title, subtitle };
}

export function getSectionPillStyle(name: string): { icon: string; modifier: string } {
  const lower = name.toLowerCase();
  const icon = lower.includes("evening") || lower.includes("night") ? "☾" : "☼";
  let modifier = "is-default";
  if (lower.includes("morning")) modifier = "is-morning";
  else if (lower.includes("evening") || lower.includes("night")) modifier = "is-evening";
  else if (lower.includes("day")) modifier = "is-day";
  return { icon, modifier };
}

export function formatOrdinalDate(date: Date): { dayName: string; dateStr: string } {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();
  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";
  return { dayName, dateStr: `${month} ${day}${suffix}, ${year}` };
}
