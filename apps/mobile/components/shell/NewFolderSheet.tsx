import React, { useState } from "react";
import { View } from "react-native";
import { Button, Input, Sheet, Text } from "../primitives";

export interface NewFolderSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreateFolder: (folderName: string) => Promise<void>;
}

export function NewFolderSheet({
  visible,
  onClose,
  onCreateFolder,
}: NewFolderSheetProps): React.ReactElement {
  const [folderName, setFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    setFolderName("");
    onClose();
  };

  const handleCreate = async () => {
    const trimmed = folderName.trim();
    if (!trimmed) {
      setError("Folder name cannot be empty.");
      return;
    }
    if (trimmed.includes("/") || trimmed.includes("\\")) {
      setError("Folder name cannot contain slashes.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateFolder(trimmed);
      setFolderName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={handleClose} title="New Folder">
      <View className="gap-3">
        <Text variant="body" color="muted">
          Enter a name for the new folder:
        </Text>
        <Input
          value={folderName}
          onChangeText={(val) => {
            setFolderName(val);
            if (error) setError(null);
          }}
          placeholder="Folder name"
          autoFocus
          onSubmitEditing={() => void handleCreate()}
        />
        {error ? (
          <Text variant="caption" color="error">
            {error}
          </Text>
        ) : null}
        <View className="flex-row gap-2 justify-end mt-2">
          <Button
            variant="secondary"
            onPress={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={() => void handleCreate()}
            disabled={!folderName.trim() || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </View>
      </View>
    </Sheet>
  );
}
