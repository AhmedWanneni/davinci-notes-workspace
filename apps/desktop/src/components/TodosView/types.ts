export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  notePath: string;
  lineIndex: number;
  section: string;
  workspace?: string;
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
  workspace: string;
  sections: TodoSection[];
}

export interface TodoWorkspace {
  name: string;
  projects: TodoProject[];
}

export type TodoViewMode = "workspace" | "month";
