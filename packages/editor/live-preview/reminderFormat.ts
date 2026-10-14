export interface FormattedReminder {
  label: string;
  isOverdue: boolean;
  tooltip: string;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatReminderChip(
  dateStr: string,
  timeStr?: string,
  now = new Date(),
  recurrence?: string,
): FormattedReminder {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr || "0", 10);
  const month = parseInt(monthStr || "1", 10) - 1;
  const day = parseInt(dayStr || "1", 10);

  let hours = 9;
  let minutes = 0;
  let hasExplicitTime = false;

  if (timeStr) {
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      hours = parseInt(parts[0] || "0", 10);
      minutes = parseInt(parts[1] || "0", 10);
      hasExplicitTime = true;
    }
  }

  const dueDate = new Date(year, month, day, hours, minutes, 0, 0);
  const isOverdue = dueDate.getTime() < now.getTime();

  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const dueMidnight = new Date(year, month, day).getTime();
  const diffDays = Math.round(
    (dueMidnight - todayMidnight) / (24 * 3600 * 1000),
  );

  let timeFormatted = "";
  if (hasExplicitTime) {
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    const mPadded = minutes < 10 ? `0${minutes}` : `${minutes}`;
    timeFormatted = ` ${h12}:${mPadded} ${ampm}`;
  }

  let dateLabel: string;
  if (diffDays === 0) {
    dateLabel = "Today";
  } else if (diffDays === 1) {
    dateLabel = "Tomorrow";
  } else if (diffDays === -1) {
    dateLabel = "Yesterday";
  } else if (diffDays > 1 && diffDays < 7) {
    dateLabel = DAY_NAMES[dueDate.getDay()] || "Upcoming";
  } else if (diffDays < -1 && diffDays > -7) {
    dateLabel = `${Math.abs(diffDays)}d ago`;
  } else if (now.getFullYear() === year) {
    dateLabel = `${MONTH_NAMES[month]} ${day}`;
  } else {
    dateLabel = `${MONTH_NAMES[month]} ${day}, ${year}`;
  }

  const baseLabel = `${dateLabel}${timeFormatted}`;
  const label = recurrence ? `${baseLabel} ↻` : baseLabel;
  const tooltipBase = hasExplicitTime
    ? `${dateStr} ${timeStr}`
    : `${dateStr} (all day)`;
  const tooltip = recurrence
    ? `${tooltipBase} (repeats: ${recurrence})`
    : tooltipBase;

  return { label, isOverdue, tooltip };
}
