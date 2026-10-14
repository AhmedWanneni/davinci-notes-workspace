import { WidgetType, EditorView } from "@codemirror/view";
import { formatReminderChip } from "./reminderFormat";

export interface ReminderClickInfo {
  from: number;
  to: number;
  date: string;
  time?: string;
  rawToken: string;
  view: EditorView;
}

export interface ReminderWidgetOptions {
  date: string;
  time?: string;
  rawToken: string;
  from: number;
  to: number;
  isDone: boolean;
  onReminderClick?: (info: ReminderClickInfo) => void;
}

export class ReminderWidget extends WidgetType {
  constructor(readonly options: ReminderWidgetOptions) {
    super();
  }

  eq(other: ReminderWidget): boolean {
    return (
      this.options.rawToken === other.options.rawToken &&
      this.options.from === other.options.from &&
      this.options.to === other.options.to &&
      this.options.isDone === other.options.isDone
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const { date, time, rawToken, from, to, isDone, onReminderClick } =
      this.options;
    const { label, isOverdue, tooltip } = formatReminderChip(date, time);

    const span = document.createElement("span");
    span.className = "cm-reminder-chip";
    if (isDone) {
      span.classList.add("cm-reminder-done");
    } else if (isOverdue) {
      span.classList.add("cm-reminder-overdue");
    }

    span.setAttribute("role", "button");
    span.setAttribute("tabindex", "0");
    span.setAttribute("title", tooltip);
    span.dataset.raw = rawToken;

    // SVG Bell icon (inline, 12x12, zero external library)
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "cm-reminder-icon");
    icon.setAttribute("viewBox", "0 0 256 256");
    icon.setAttribute("width", "12");
    icon.setAttribute("height", "12");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      '<path fill="currentColor" d="M221.8 175.94c-5.55-9.56-13.8-22.38-13.8-63.94a80 80 0 0 0-72-79.6V24a8 8 0 0 0-16 0v8.4A80 80 0 0 0 48 112c0 41.56-8.25 54.38-13.8 63.94A16 16 0 0 0 48 200h40a40 40 0 0 0 80 0h40a16 16 0 0 0 13.8-24.06M128 216a24 24 0 0 1-22.62-16h45.24A24 24 0 0 1 128 216m-80-32c7.7-13.28 16-34.1 16-72a64 64 0 0 1 128 0c0 37.9 8.3 58.72 16 72Z"/>';

    const textSpan = document.createElement("span");
    textSpan.className = "cm-reminder-label";
    textSpan.textContent = label;

    span.appendChild(icon);
    span.appendChild(textSpan);

    span.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onReminderClick?.({
        from,
        to,
        date,
        time,
        rawToken,
        view,
      });
    });

    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
