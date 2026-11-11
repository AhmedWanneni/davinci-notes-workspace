import { create } from "zustand";
import type { TodoViewMode } from "./types";

export interface TodosUIState {
  viewMode: TodoViewMode;
  selectedProjectId: string;
  selectedNotePath: string;
  isMotherboard: boolean;
  searchQuery: string;
  selectedMonth: string;
  statusFilter: "all" | "pending" | "completed" | "dated";
  motherboardLayout: "cards" | "list";

  setViewMode: (viewMode: TodoViewMode) => void;
  setSelectedProjectId: (selectedProjectId: string) => void;
  setSelectedNotePath: (selectedNotePath: string) => void;
  setIsMotherboard: (isMotherboard: boolean) => void;
  setSearchQuery: (searchQuery: string) => void;
  setSelectedMonth: (selectedMonth: string) => void;
  setStatusFilter: (statusFilter: "all" | "pending" | "completed" | "dated") => void;
  setMotherboardLayout: (motherboardLayout: "cards" | "list") => void;
}

export const initialTodosUIState = {
  viewMode: "project" as TodoViewMode,
  selectedProjectId: "",
  selectedNotePath: "",
  isMotherboard: false,
  searchQuery: "",
  selectedMonth: "all",
  statusFilter: "all" as const,
  motherboardLayout: "cards" as const,
};

export const useTodosUIStore = create<TodosUIState>((set) => ({
  ...initialTodosUIState,

  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  setSelectedNotePath: (selectedNotePath) => set({ selectedNotePath }),
  setIsMotherboard: (isMotherboard) => set({ isMotherboard }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setMotherboardLayout: (motherboardLayout) => set({ motherboardLayout }),
}));
