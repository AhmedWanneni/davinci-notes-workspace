import React, { useEffect, useState } from "react";
import { View, Modal, Pressable, ScrollView } from "react-native";
import { X, Folder, HouseLine, CaretRight } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { defaultVaultManager } from "../../vault/vaultManager";

export interface SelectFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFolder: (folderPath: string) => void;
}

export function SelectFolderModal({
  visible,
  onClose,
  onSelectFolder,
}: SelectFolderModalProps): React.ReactElement {
  const { tokens } = useTheme();
  const [folders, setFolders] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    async function loadFolders() {
      try {
        const { adapter } = await defaultVaultManager.getActiveAdapter();
        if (!adapter) return;
        const list = await adapter.listFolders();
        setFolders(list.slice().sort());
      } catch {
        setFolders([]);
      }
    }
    void loadFolders();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center px-5" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
        <View
          className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg"
          style={{
            backgroundColor: tokens.color.bg.primary,
            borderWidth: 1,
            borderColor: tokens.color.border.subtle,
            maxHeight: "80%",
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3.5 border-b" style={{ borderBottomColor: tokens.color.border.subtle }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: tokens.color.text.normal }}>
                New Note
              </Text>
              <Text style={{ fontSize: 12, color: tokens.color.text.muted }}>
                Choose destination folder
              </Text>
            </View>
            <Pressable onPress={onClose} className="p-1 active:opacity-60" accessibilityLabel="Close folder picker">
              <X size={18} color="#000000" />
            </Pressable>
          </View>

          {/* Folder choices */}
          <ScrollView className="py-1" showsVerticalScrollIndicator={false}>
            {/* Vault Root row */}
            <Pressable
              onPress={() => {
                onClose();
                onSelectFolder("");
              }}
              className="flex-row items-center justify-between px-4 py-3 active:bg-bg-hover"
            >
              <View className="flex-row items-center gap-2.5 flex-1">
                <HouseLine size={18} color="#000000" weight="regular" />
                <Text style={{ fontSize: 14, fontWeight: "600", color: tokens.color.text.normal }}>
                  Vault Root (/)
                </Text>
              </View>
              <CaretRight size={14} color={tokens.color.text.muted} />
            </Pressable>

            {/* Existing Folders */}
            {folders.map((f) => (
              <Pressable
                key={f}
                onPress={() => {
                  onClose();
                  onSelectFolder(f);
                }}
                className="flex-row items-center justify-between px-4 py-3 border-t active:bg-bg-hover"
                style={{ borderTopColor: tokens.color.border.subtle }}
              >
                <View className="flex-row items-center gap-2.5 flex-1">
                  <Folder size={18} color="#000000" weight="fill" />
                  <Text numberOfLines={1} style={{ fontSize: 14, color: tokens.color.text.normal, flex: 1 }}>
                    {f}
                  </Text>
                </View>
                <CaretRight size={14} color={tokens.color.text.muted} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
