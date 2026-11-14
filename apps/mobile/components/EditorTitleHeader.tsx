import React, { useState, useEffect } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Text } from "./primitives";
import { defaultVaultManager } from "../vault/vaultManager";
import { defaultVaultIndexer } from "../indexer";

export interface EditorTitleHeaderProps {
  activePath: string;
  onPathChange: (newPath: string) => void;
  textColor: string;
}

export function EditorTitleHeader({
  activePath,
  onPathChange,
  textColor,
}: EditorTitleHeaderProps): React.ReactElement {
  const rawTitle = activePath.replace(/\.md$/i, "").split("/").pop() ?? "Untitled";
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(rawTitle);

  useEffect(() => {
    setTitleInput(rawTitle);
  }, [rawTitle]);

  const handleCommit = async () => {
    setIsEditing(false);
    const clean = titleInput.trim();
    if (!clean || clean === rawTitle) {
      setTitleInput(rawTitle);
      return;
    }
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;
      const dir = activePath.includes("/") ? activePath.slice(0, activePath.lastIndexOf("/")) : "";
      const newPath = dir ? `${dir}/${clean}.md` : `${clean}.md`;
      await adapter.renameNote(activePath, newPath);
      onPathChange(newPath);
      void defaultVaultIndexer.indexVault(adapter, false);
    } catch (err) {
      console.warn("[EditorTitleHeader] Failed to rename:", err);
      setTitleInput(rawTitle);
    }
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
      {isEditing ? (
        <TextInput
          value={titleInput}
          onChangeText={setTitleInput}
          onBlur={handleCommit}
          onSubmitEditing={handleCommit}
          autoFocus
          selectTextOnFocus
          returnKeyType="done"
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: textColor,
            lineHeight: 36,
            padding: 0,
            margin: 0,
          }}
        />
      ) : (
        <Pressable onPress={() => setIsEditing(true)}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: textColor, lineHeight: 36 }}>
            {rawTitle}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
