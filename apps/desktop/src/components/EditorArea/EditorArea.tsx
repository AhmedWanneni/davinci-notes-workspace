import { useMemo } from "react";
import { Editor } from "@app/editor";
import { FileText } from "@phosphor-icons/react";
import { parseFrontmatter } from "@app/indexer";
import { EmptyState } from "../EmptyState";
import { PropertiesBlock } from "../PropertiesBlock";
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

  const { frontmatter } = useMemo(
    () => (activeNotePath ? parseFrontmatter(content) : { frontmatter: {} }),
    [activeNotePath, content],
  );

  const displayTitle = useMemo(() => {
    if (!activeNotePath) return "";
    return (
      activeNotePath.replace(/\.md$/i, "").split("/").pop() ?? activeNotePath
    );
  }, [activeNotePath]);

  return (
    <div className="editor-area">
      {activeNotePath ? (
        <div className="editor-area__container">
          <div className="editor-area__header">
            <h1 className="editor-area__title">{displayTitle}</h1>
            <PropertiesBlock
              frontmatter={frontmatter}
              onLinkClick={onLinkClick}
            />
          </div>
          <div className="editor-area__body">
            <Editor
              key={activeNotePath}
              value={content}
              onChange={(newVal) => updateNoteContent(activeNotePath, newVal)}
              notePaths={allNotePaths}
              sourcePath={activeNotePath}
              onLinkClick={onLinkClick}
            />
          </div>
        </div>
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
