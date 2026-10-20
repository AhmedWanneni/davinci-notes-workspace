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

  const handleCreate = async () => {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onCreateFolder(trimmed);
      setFolderName("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="New Folder">
      <View className="gap-3">
        <Text variant="body" color="muted">
          Enter a name for the new folder:
        </Text>
        <Input
          value={folderName}
          onChangeText={setFolderName}
          placeholder="Folder name"
          autoFocus
          onSubmitEditing={() => void handleCreate()}
        />
        <View className="flex-row gap-2 justify-end mt-2">
          <Button variant="secondary" onPress={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={() => void handleCreate()}
            disabled={!folderName.trim() || isSubmitting}
          >
            Create
          </Button>
        </View>
      </View>
    </Sheet>
  );
}
