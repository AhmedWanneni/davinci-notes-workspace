import { Editor } from "@app/editor";
import { FileText } from "@phosphor-icons/react";
import { EmptyState } from "../EmptyState";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

export interface EditorAreaProps {
  activeNotePath: string | null;
  allNotePaths: string[];
  onLinkClick: (target: string) => void;
}

export function EditorArea({
  activeNotePath,
  allNotePaths,
  onLinkClick,
}: EditorAreaProps) {
  const content = useWorkspaceStore(
    (state) => (activeNotePath ? state.notesContent[activeNotePath] : "") || "",
  );
  const updateNoteContent = useWorkspaceStore(
    (state) => state.updateNoteContent,
  );

  return (
    <div className="editor-area">
      {activeNotePath ? (
        <Editor
          key={activeNotePath}
          value={content}
          onChange={(newVal) => updateNoteContent(activeNotePath, newVal)}
          notePaths={allNotePaths}
          sourcePath={activeNotePath}
          onLinkClick={onLinkClick}
        />
      ) : (
        <EmptyState
          size="lg"
          icon={<FileText weight="regular" />}
          title="No Note Open"
          description="Select a note from the sidebar, press Cmd+K to search, or click 'New Note' to start writing."
        />
      )}
    </div>
  );
}
