export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  notePath: string;
  lineIndex: number;
  section: string;
  folder?: string;
  project?: string;
  dueDate?: string;
  month?: string;
  linkedNotePath?: string;
  subtasksCount?: number;
  label?: string;
  hasReminder?: boolean;
  workspace?: string;
}

export interface TodoSection {
  name: string;
  todos: TodoItem[];
}

export interface TodoNote {
  id: string;
  name: string;
  notePath: string;
  sections: TodoSection[];
}

export interface TodoProject {
  id: string;
  name: string;
  folderPath: string;
  notePath: string;
  notes: TodoNote[];
  folder?: string;
  sections: TodoSection[];
}

export interface TodoFolder {
  name: string;
  projects: TodoProject[];
}

export type TodoViewMode = "project" | "motherboard" | "reminders" | "scheduled";
export type MotherboardLayout = "cards" | "list";
export type TodoStatusFilter = "all" | "pending" | "completed" | "dated";
export type ReminderFilter = "all" | "overdue" | "today" | "upcoming" | "completed";
export type ScheduledFilter = "all" | "scheduled" | "needs_manual_send" | "missed" | "sent";
