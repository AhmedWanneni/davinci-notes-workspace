export interface MobileTodoItem {
  id: string;
  text: string;
  completed: boolean;
  lineIndex: number;
  section: string;
  reminder?: string;
  duration?: string;
  streakDays?: number;
  iconName?: "water" | "bicycle" | "stretch" | "walk" | "book" | "check";
  notePath?: string;
  project?: string;
  dueDate?: string;
}

export interface MobileTodoSection {
  name: string;
  todos: MobileTodoItem[];
}

export interface MobileTodoList {
  id: string;
  name: string;
  notePath: string;
  projectName: string;
  todoCount: number;
}

export interface MobileTodoProject {
  id: string;
  name: string;
  folderPath: string;
  todoLists: MobileTodoList[];
  noteCount: number;
  todoCount: number;
}

export type MobileTodoDateFilter = "all" | "today" | "upcoming" | "dated";
export type MobileTodoStatusFilter = "all" | "pending" | "completed";

export interface MobileReminderEvent {
  id: string;
  title: string;
  dateTime: string;
  project: string;
  status: "early" | "late" | "upcoming" | "completed";
  notePath?: string;
  lineIndex?: number;
}

export interface WeeklyCalendarDay {
  dayName: string; // "Mon", "Tue", etc.
  dayNumber: number; // 7, 8, 10
  dateString: string; // "2025-03-10"
  isToday: boolean;
  isSelected: boolean;
}
