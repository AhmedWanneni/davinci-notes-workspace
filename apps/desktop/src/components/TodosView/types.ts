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
}

export interface TodoSection {
  name: string;
  todos: TodoItem[];
}

export interface TodoProject {
  id: string;
  name: string;
  notePath: string;
  folder?: string;
  sections: TodoSection[];
}

export interface TodoFolder {
  name: string;
  projects: TodoProject[];
}

export type TodoViewMode = "project" | "motherboard";
export type MotherboardLayout = "cards" | "list";
export type TodoStatusFilter = "all" | "pending" | "completed" | "dated";
