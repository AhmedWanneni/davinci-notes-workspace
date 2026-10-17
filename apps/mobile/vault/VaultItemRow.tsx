import React from "react";
import { Folder, FileText, PushPin } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { ListItem } from "../components/primitives";
import type { RowItem } from "./folderViewHelpers";

export interface VaultItemRowProps {
  item: RowItem;
  isPinned: boolean;
  onPressFolder: (path: string) => void;
  onPressNote: (path: string) => void;
  onLongPressNote: (path: string) => void;
}

export const VaultItemRow: React.FC<VaultItemRowProps> = ({
  item,
  isPinned,
  onPressFolder,
  onPressNote,
  onLongPressNote,
}) => {
  if (item.type === "folder") {
    const folderName = item.path.split("/").pop() ?? item.path;
    return (
      <ListItem
        title={folderName}
        subtitle="Folder"
        left={<Folder size={20} color={darkColorTokens.text.muted} />}
        onPress={() => onPressFolder(item.path)}
      />
    );
  }

  const noteName = item.path.split("/").pop() ?? item.path;
  return (
    <ListItem
      title={noteName}
      subtitle="Markdown note"
      left={<FileText size={20} color={darkColorTokens.text.accent} />}
      right={
        isPinned ? (
          <PushPin
            size={16}
            color={darkColorTokens.text.accent}
            weight="fill"
          />
        ) : undefined
      }
      onPress={() => onPressNote(item.path)}
      onLongPress={() => onLongPressNote(item.path)}
    />
  );
};
