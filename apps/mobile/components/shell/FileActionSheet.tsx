import React, { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import {
  FileText,
  FolderSimple,
  PushPin,
  PencilSimple,
  Trash,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Button, Input, Sheet, SheetGroup, Text } from "../primitives";

export interface FileActionSheetProps {
  targetPath: string | null;
  isPinned: boolean;
  folders: string[];
  visible: boolean;
  onClose: () => void;
  onOpen: (path: string) => void;
  onTogglePin: (path: string) => void;
  onRename: (path: string, newStem: string) => Promise<void>;
  onMove: (path: string, destinationFolder: string) => Promise<void>;
  onDelete: (path: string) => Promise<void>;
}

export function FileActionSheet({
  targetPath,
  isPinned,
  folders,
  visible,
  onClose,
  onOpen,
  onTogglePin,
  onRename,
  onMove,
  onDelete,
}: FileActionSheetProps): React.ReactElement {
  const { tokens } = useTheme();
  const [mode, setMode] = useState<
    "menu" | "rename" | "move" | "delete_confirm"
  >("menu");
  const [renameValue, setRenameValue] = useState("");

  const resetAndClose = () => {
    setMode("menu");
    setRenameValue("");
    onClose();
  };

  if (!targetPath) return <></>;

  const filename = targetPath.split("/").pop() ?? targetPath;
  const stem = filename.replace(/\.md$/i, "");

  const handleStartRename = () => {
    setRenameValue(stem);
    setMode("rename");
  };

  const handleConfirmRename = async () => {
    if (renameValue.trim() && renameValue.trim() !== stem) {
      await onRename(targetPath, renameValue.trim());
    }
    resetAndClose();
  };

  return (
    <Sheet visible={visible} onClose={resetAndClose} title={filename}>
      {mode === "menu" ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <SheetGroup>
            <Pressable
              onPress={() => {
                onOpen(targetPath);
                resetAndClose();
              }}
              className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] active:bg-bg-hover"
              accessibilityRole="button"
            >
              <FileText size={20} color={tokens.color.interactive.accent} />
              <Text variant="body" color="normal">
                Open Note
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onTogglePin(targetPath);
                resetAndClose();
              }}
              className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] border-t active:bg-bg-hover"
              style={{ borderTopColor: tokens.color.border.subtle }}
              accessibilityRole="button"
            >
              <PushPin
                size={20}
                color={tokens.color.text.normal}
                weight={isPinned ? "fill" : "regular"}
              />
              <Text variant="body" color="normal">
                {isPinned ? "Unpin Note" : "Pin Note to Top"}
              </Text>
            </Pressable>
          </SheetGroup>

          <SheetGroup>
            <Pressable
              onPress={handleStartRename}
              className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] active:bg-bg-hover"
              accessibilityRole="button"
            >
              <PencilSimple size={20} color={tokens.color.text.normal} />
              <Text variant="body" color="normal">
                Rename...
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("move")}
              className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] border-t active:bg-bg-hover"
              style={{ borderTopColor: tokens.color.border.subtle }}
              accessibilityRole="button"
            >
              <FolderSimple size={20} color={tokens.color.text.normal} />
              <Text variant="body" color="normal">
                Move to Folder...
              </Text>
            </Pressable>
          </SheetGroup>

          <SheetGroup>
            <Pressable
              onPress={() => setMode("delete_confirm")}
              className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] active:bg-bg-hover"
              accessibilityRole="button"
            >
              <Trash size={20} color={tokens.color.text.error} />
              <Text variant="body" color="error">
                Delete Note
              </Text>
            </Pressable>
          </SheetGroup>
        </ScrollView>
      ) : mode === "rename" ? (
        <View className="gap-3">
          <Text variant="body" color="muted">
            Enter a new name for this note:
          </Text>
          <Input
            value={renameValue}
            onChangeText={setRenameValue}
            autoFocus
            selectTextOnFocus
            placeholder="Note name"
          />
          <View className="flex-row gap-2 justify-end mt-2">
            <Button variant="secondary" onPress={() => setMode("menu")}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={() => void handleConfirmRename()}
            >
              Save
            </Button>
          </View>
        </View>
      ) : mode === "move" ? (
        <View className="gap-3 max-h-[300px]">
          <Text variant="body" color="muted">
            Select destination folder:
          </Text>
          <ScrollView className="max-h-[220px]">
            <SheetGroup>
              <Pressable
                onPress={async () => {
                  await onMove(targetPath, "");
                  resetAndClose();
                }}
                className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] active:bg-bg-hover"
              >
                <FolderSimple
                  size={20}
                  color={tokens.color.interactive.accent}
                />
                <Text variant="body" color="normal">
                  / (Vault Root)
                </Text>
              </Pressable>
              {folders.map((f) => (
                <Pressable
                  key={f}
                  onPress={async () => {
                    await onMove(targetPath, f);
                    resetAndClose();
                  }}
                  className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] border-t active:bg-bg-hover"
                  style={{ borderTopColor: tokens.color.border.subtle }}
                >
                  <FolderSimple
                    size={20}
                    color={tokens.color.interactive.accent}
                  />
                  <Text variant="body" color="normal">
                    {f}
                  </Text>
                </Pressable>
              ))}
            </SheetGroup>
          </ScrollView>
          <Button variant="secondary" onPress={() => setMode("menu")}>
            Cancel
          </Button>
        </View>
      ) : (
        <View className="gap-4">
          <Text variant="body" color="normal">
            Are you sure you want to delete{" "}
            <Text weight="bold">{filename}</Text>? This cannot be undone.
          </Text>
          <View className="flex-row gap-2 justify-end">
            <Button variant="secondary" onPress={() => setMode("menu")}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={async () => {
                await onDelete(targetPath);
                resetAndClose();
              }}
            >
              Delete
            </Button>
          </View>
        </View>
      )}
    </Sheet>
  );
}
