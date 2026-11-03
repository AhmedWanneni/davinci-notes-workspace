import { useState, useMemo } from "react";
import {
  Plus,
  Trash,
  PaperPlaneTilt,
  Check,
  Circle,
  PencilSimple,
  FileText,
} from "@phosphor-icons/react";
import type { LibraryItem, LibraryItemType } from "@app/ai-agent";
import { useAgentStore } from "../useAgentStore";
import { useWorkspaceStore } from "../../../state/useWorkspaceStore";
import { DEFAULT_LIBRARY_ITEMS } from "./agentLibraryDefaults";
import {
  formatSingleLibraryPrompt,
  formatBatchLibraryPrompts,
} from "./agentLibraryActions";
import { AgentLibraryTopBar } from "./AgentLibraryTopBar";
import { AgentLibraryCard } from "./AgentLibraryCard";
import { AgentLibraryModal } from "./AgentLibraryModal";
import styles from "./AgentLibraryBoard.module.scss";

export function AgentLibraryBoard() {
  const storeLibraryItems = useAgentStore((s) => s.libraryItems);
  const storeProjects = useAgentStore((s) => s.projects);
  const libraryItems =
    Array.isArray(storeLibraryItems) && storeLibraryItems.length > 0
      ? storeLibraryItems
      : DEFAULT_LIBRARY_ITEMS;
  const projects = Array.isArray(storeProjects) ? storeProjects : [];
  const addOrUpdateLibraryItem = useAgentStore((s) => s.addOrUpdateLibraryItem);
  const deleteLibraryItem = useAgentStore((s) => s.deleteLibraryItem);
  const insertIntoActivePrompt = useAgentStore((s) => s.insertIntoActivePrompt);
  const openNote = useWorkspaceStore((s) => s.openNote);

  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<LibraryItemType | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);

  const filteredItems = useMemo(() => {
    return libraryItems.filter((item) => {
      if (!item) return false;
      if (projectFilter && item.projectId !== projectFilter) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      return true;
    });
  }, [libraryItems, projectFilter, typeFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUseSingleInPrompt = (item: LibraryItem) => {
    insertIntoActivePrompt(formatSingleLibraryPrompt(item));
  };

  const handleBatchUseInPrompt = () => {
    const selected = libraryItems.filter((i) => selectedIds.has(i.id));
    if (selected.length === 0) return;
    insertIntoActivePrompt(formatBatchLibraryPrompts(selected));
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    if (window.confirm(`Delete ${selectedIds.size} selected items?`)) {
      selectedIds.forEach((id) => void deleteLibraryItem(id));
      setSelectedIds(new Set());
    }
  };

  const handleSaveModal = (itemPartial: Partial<LibraryItem>) => {
    const item: LibraryItem = {
      id:
        itemPartial.id ||
        `lib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: itemPartial.type || "prompt",
      projectId: itemPartial.projectId ?? null,
      title: itemPartial.title || "Untitled",
      description: itemPartial.description || "",
      content: itemPartial.content || "",
      tags: itemPartial.tags || [],
      createdAt: itemPartial.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    void addOrUpdateLibraryItem(item);
  };

  const getProjectName = (pId?: string | null) => {
    if (!pId) return "All Projects";
    return projects.find((p) => p.id === pId)?.name || "Project";
  };

  return (
    <div
      className={styles["library-board"]}
      role="region"
      aria-label="Library Board"
    >
      <AgentLibraryTopBar
        projects={projects}
        projectFilter={projectFilter}
        onSelectProjectFilter={setProjectFilter}
        typeFilter={typeFilter}
        onSelectTypeFilter={setTypeFilter}
        filteredCount={filteredItems.length}
        selectedCount={selectedIds.size}
        onToggleSelectAll={() => {
          if (selectedIds.size === filteredItems.length)
            setSelectedIds(new Set());
          else setSelectedIds(new Set(filteredItems.map((i) => i.id)));
        }}
        onBatchUseInPrompt={handleBatchUseInPrompt}
        onBatchDelete={handleBatchDelete}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      <div className={styles["library-board__subheader"]}>
        <p className={styles["library-board__info-text"]}>
          Sophia Library • Skills, rules, and prompts organized by project.
        </p>
        <button
          type="button"
          className={styles["library-board__add-new-btn"]}
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={15} weight="bold" />
          <span>ADD NEW</span>
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className={styles["library-board__empty"]}>
          <p>No library items found matching your filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className={styles["library-board__grid"]}>
          {filteredItems.map((item) => (
            <AgentLibraryCard
              key={item.id}
              item={item}
              projectName={getProjectName(item.projectId)}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              onUseInPrompt={() => handleUseSingleInPrompt(item)}
              onEdit={() => {
                setEditingItem(item);
                setIsModalOpen(true);
              }}
              onDelete={() => void deleteLibraryItem(item.id)}
              onOpenNote={(path) => void openNote(path)}
            />
          ))}
        </div>
      ) : (
        <div className={styles["library-board__list"]}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`${styles["library-board__list-row"]} ${selectedIds.has(item.id) ? styles["is-selected"] : ""}`}
            >
              <div className={styles["library-board__list-left"]}>
                <button
                  type="button"
                  className={styles["library-card__select-btn"]}
                  onClick={() => toggleSelect(item.id)}
                >
                  {selectedIds.has(item.id) ? (
                    <Check size={12} weight="bold" />
                  ) : (
                    <Circle size={10} />
                  )}
                </button>
                <span className={styles["library-board__list-title"]}>
                  {item.title}
                </span>
                <span className={styles["library-card__project-tag"]}>
                  {getProjectName(item.projectId)}
                </span>
                {item.filePath && (
                  <span
                    className={styles["library-card__path-tag"]}
                    title={`Open file: ${item.filePath}`}
                    onClick={() => void openNote(item.filePath!)}
                  >
                    {item.filePath}
                  </span>
                )}
              </div>
              <div className={styles["library-card__actions"]}>
                {item.filePath && (
                  <button
                    type="button"
                    className={styles["library-card__action-btn"]}
                    onClick={() => void openNote(item.filePath!)}
                    title={`Open ${item.filePath} in editor`}
                    aria-label={`Open ${item.title} in editor`}
                  >
                    <FileText size={12} />
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles["library-card__action-btn"]} ${styles["is-primary"]}`}
                  onClick={() => handleUseSingleInPrompt(item)}
                  title="Use in prompt"
                >
                  <PaperPlaneTilt size={12} weight="fill" />
                </button>
                <button
                  type="button"
                  className={styles["library-card__action-btn"]}
                  onClick={() => {
                    setEditingItem(item);
                    setIsModalOpen(true);
                  }}
                  title="Edit item"
                >
                  <PencilSimple size={12} />
                </button>
                <button
                  type="button"
                  className={`${styles["library-card__action-btn"]} ${styles["is-danger"]}`}
                  onClick={() => void deleteLibraryItem(item.id)}
                  title="Delete item"
                >
                  <Trash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AgentLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        projects={projects}
        initialItem={editingItem}
        defaultProjectId={projectFilter}
      />
    </div>
  );
}
