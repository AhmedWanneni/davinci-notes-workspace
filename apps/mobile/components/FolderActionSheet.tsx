import React, { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import {
  FileText,
  Folder,
  FolderSimple,
  PushPin,
  Trash,
} from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Button, Sheet, Text } from "./primitives";

export interface FolderActionSheetProps {
  targetNote: string | null;
  isPinned: boolean;
  folders: string[];
  visible: boolean;
  onClose: () => void;
  onOpen: (path: string) => void;
  onTogglePin: (path: string) => void;
  onMove: (path: string, destinationFolder: string) => void;
  onDelete: (path: string) => void;
}

export function FolderActionSheet({
  targetNote,
  isPinned,
  folders,
  visible,
  onClose,
  onOpen,
  onTogglePin,
  onMove,
  onDelete,
}: FolderActionSheetProps): React.ReactElement {
  const [mode, setMode] = useState<"menu" | "move" | "delete_confirm">("menu");

  const resetAndClose = () => {
    setMode("menu");
    onClose();
  };

  if (!targetNote) return <></>;

  const filename = targetNote.split("/").pop() ?? targetNote;

  return (
    <Sheet visible={visible} onClose={resetAndClose} title={filename}>
      {mode === "menu" ? (
        <View className="gap-1">
          <Pressable
            onPress={() => {
              onOpen(targetNote);
              resetAndClose();
            }}
            className="flex-row items-center gap-3 p-3 min-h-[44px] rounded-md active:bg-bg-hover"
            accessibilityRole="button"
          >
            <FileText size={20} color={darkColorTokens.text.accent} />
            <Text variant="body" color="normal">
              Open Note
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              onTogglePin(targetNote);
              resetAndClose();
            }}
            className="flex-row items-center gap-3 p-3 min-h-[44px] rounded-md active:bg-bg-hover"
            accessibilityRole="button"
          >
            <PushPin
              size={20}
              color={darkColorTokens.text.normal}
              weight={isPinned ? "fill" : "regular"}
            />
            <Text variant="body" color="normal">
              {isPinned ? "Unpin Note" : "Pin Note to Top"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode("move")}
            className="flex-row items-center gap-3 p-3 min-h-[44px] rounded-md active:bg-bg-hover"
            accessibilityRole="button"
          >
            <FolderSimple size={20} color={darkColorTokens.text.normal} />
            <Text variant="body" color="normal">
              Move to Folder...
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode("delete_confirm")}
            className="flex-row items-center gap-3 p-3 min-h-[44px] rounded-md active:bg-bg-hover"
            accessibilityRole="button"
          >
            <Trash size={20} color={darkColorTokens.text.error} />
            <Text variant="body" color="error">
              Delete Note
            </Text>
          </Pressable>
        </View>
      ) : null}

      {mode === "move" ? (
        <View>
          <Text variant="caption" color="muted" className="mb-2">
            Select destination folder for "{filename}":
          </Text>
          <ScrollView className="max-h-[40vh] mb-3">
            <Pressable
              onPress={() => {
                onMove(targetNote, "");
                resetAndClose();
              }}
              className="flex-row items-center gap-2 p-3 min-h-[44px] border-b border-border-subtle active:bg-bg-hover"
            >
              <Folder size={18} color={darkColorTokens.text.accent} />
              <Text variant="body" color="normal">
                / (Vault Root)
              </Text>
            </Pressable>
            {folders.map((folder) => (
              <Pressable
                key={folder}
                onPress={() => {
                  onMove(targetNote, folder);
                  resetAndClose();
                }}
                className="flex-row items-center gap-2 p-3 min-h-[44px] border-b border-border-subtle active:bg-bg-hover"
              >
                <Folder size={18} color={darkColorTokens.text.muted} />
                <Text variant="body" color="normal">
                  {folder}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Button variant="secondary" onPress={() => setMode("menu")}>
            Back
          </Button>
        </View>
      ) : null}

      {mode === "delete_confirm" ? (
        <View>
          <Text variant="body" color="normal" className="mb-2">
            Are you sure you want to delete "{filename}"?
          </Text>
          <Text variant="caption" color="muted" className="mb-4">
            This action deletes the note from disk and removes it from the
            index.
          </Text>
          <View className="flex-row gap-3 justify-end">
            <Button variant="secondary" onPress={() => setMode("menu")}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={() => {
                onDelete(targetNote);
                resetAndClose();
              }}
            >
              Confirm Delete
            </Button>
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}
