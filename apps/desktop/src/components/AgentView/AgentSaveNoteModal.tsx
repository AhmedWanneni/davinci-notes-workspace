import { useState, useMemo } from "react";
import { FolderSimple, FileText, Check, Plus } from "@phosphor-icons/react";
import { WindowDialog } from "../WindowDialog";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { createNoteInVault } from "../../vault/createNoteInVault";
import styles from "./AgentSaveNoteModal.module.scss";

export interface AgentSaveNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export function AgentSaveNoteModal({
  isOpen,
  onClose,
  content,
}: AgentSaveNoteModalProps) {
  const [mode, setMode] = useState<"new" | "append">("new");
  const [folder, setFolder] = useState<string>("");
  const [title, setTitle] = useState<string>("AI Note");
  const [selectedNote, setSelectedNote] = useState<string>("");
  const [searchNote, setSearchNote] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const allNotePaths = useWorkspaceStore((s) => s.allNotePaths);
  const notesContent = useWorkspaceStore((s) => s.notesContent);

  const availableFolders = useMemo(() => {
    const set = new Set<string>();
    for (const p of allNotePaths) {
      if (p.includes("/")) {
        set.add(p.slice(0, p.lastIndexOf("/")));
      }
    }
    return Array.from(set).sort();
  }, [allNotePaths]);

  const filteredNotes = useMemo(() => {
    if (!searchNote.trim()) return allNotePaths.slice(0, 30);
    const q = searchNote.toLowerCase();
    return allNotePaths.filter((p) => p.toLowerCase().includes(q)).slice(0, 30);
  }, [allNotePaths, searchNote]);

  if (!isOpen) return null;

  const handleCreateNew = async () => {
    const cleanTitle =
      title.trim().replace(/\.md$/, "") || `AI Note ${Date.now()}`;
    const cleanFolder = folder.trim().replace(/^\/+|\/+$/g, "");
    const finalPath = cleanFolder
      ? `${cleanFolder}/${cleanTitle}.md`
      : `${cleanTitle}.md`;

    try {
      await createNoteInVault(finalPath, content);
      setStatusMsg(`Created note: ${finalPath}`);
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      setStatusMsg(
        `Failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleAppend = async () => {
    if (!selectedNote) return;
    try {
      const current = notesContent[selectedNote] || "";
      const updated = current ? `${current}\n\n${content}` : content;
      await createNoteInVault(selectedNote, updated);
      setStatusMsg(`Appended to: ${selectedNote}`);
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      setStatusMsg(
        `Failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  return (
    <WindowDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Save Response to Vault"
      size="md"
    >
      <div style={{ padding: "16px 20px" }}>
        <div className={styles["modal__tabs"]}>
          <button
            type="button"
            className={`${styles["modal__tab"]} ${mode === "new" ? styles["is-active"] : ""}`}
            onClick={() => setMode("new")}
          >
            Create New Note
          </button>
          <button
            type="button"
            className={`${styles["modal__tab"]} ${mode === "append" ? styles["is-active"] : ""}`}
            onClick={() => setMode("append")}
          >
            Append to Existing
          </button>
        </div>

        {statusMsg ? (
          <div className={styles["modal__status"]}>
            <Check size={16} weight="bold" />
            <span>{statusMsg}</span>
          </div>
        ) : mode === "new" ? (
          <div className={styles["modal__body"]}>
            <label className={styles["modal__label"]}>
              <span>Destination Folder</span>
              <div className={styles["modal__folder-select-wrap"]}>
                <select
                  className={styles["modal__select"]}
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                >
                  <option value="">Vault Root (/)</option>
                  {availableFolders.map((f) => (
                    <option key={f} value={f}>
                      📁 {f}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className={styles["modal__label"]}>
              <span>Note Title</span>
              <input
                type="text"
                className={styles["modal__input"]}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note Title"
              />
            </label>

            <button
              type="button"
              className={styles["modal__submit-btn"]}
              onClick={handleCreateNew}
            >
              <Plus size={16} weight="bold" />
              <span>Create Note</span>
            </button>
          </div>
        ) : (
          <div className={styles["modal__body"]}>
            <label className={styles["modal__label"]}>
              <span>Search Note to Append</span>
              <input
                type="text"
                className={styles["modal__input"]}
                value={searchNote}
                onChange={(e) => setSearchNote(e.target.value)}
                placeholder="Filter notes..."
              />
            </label>

            <div className={styles["modal__note-list"]}>
              {filteredNotes.map((path) => (
                <button
                  key={path}
                  type="button"
                  className={`${styles["modal__note-item"]} ${selectedNote === path ? styles["is-active"] : ""}`}
                  onClick={() => setSelectedNote(path)}
                >
                  <FolderSimple size={14} />
                  <span>{path}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles["modal__submit-btn"]}
              onClick={handleAppend}
              disabled={!selectedNote}
            >
              <span>
                Append to{" "}
                {selectedNote ? selectedNote.split("/").pop() : "Note"}
              </span>
            </button>
          </div>
        )}
      </div>
    </WindowDialog>
  );
}
