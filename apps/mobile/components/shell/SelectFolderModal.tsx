import React, { useEffect, useState } from "react";
import { View, Modal, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Folder,
  HouseLine,
  CaretRight,
} from "phosphor-react-native";
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
  const insets = useSafeAreaInsets();
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        className="flex-1"
        style={{
          backgroundColor: tokens.color.bg.primary,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Fullscreen Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3 border-b"
          style={{ borderBottomColor: tokens.color.border.subtle }}
        >
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close folder picker"
            className="w-9 h-9 items-center justify-center -ml-1 rounded-lg active:opacity-60"
          >
            <ArrowLeft size={22} color={tokens.color.text.normal} />
          </Pressable>

          <View className="items-center flex-1 mx-2">
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: tokens.color.text.normal,
              }}
            >
              Choose Destination Folder
            </Text>
          </View>

          <View className="w-9" />
        </View>

        {/* Folder choices full list */}
        <ScrollView
          className="flex-1 py-1"
          showsVerticalScrollIndicator={false}
        >
          {/* Vault Root row */}
          <Pressable
            onPress={() => {
              onClose();
              onSelectFolder("");
            }}
            accessibilityRole="button"
            accessibilityLabel="Vault root"
            className="flex-row items-center justify-between px-4 py-3.5 active:bg-bg-hover"
          >
            <View className="flex-row items-center gap-3 flex-1">
              <HouseLine
                size={20}
                color={tokens.color.text.normal}
                weight="regular"
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: tokens.color.text.normal,
                }}
              >
                Vault Root (/)
              </Text>
            </View>
            <CaretRight size={16} color={tokens.color.text.muted} />
          </Pressable>

          {/* Existing Folders */}
          {folders.map((f) => (
            <Pressable
              key={f}
              onPress={() => {
                onClose();
                onSelectFolder(f);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Folder ${f}`}
              className="flex-row items-center justify-between px-4 py-3.5 border-t active:bg-bg-hover"
              style={{ borderTopColor: tokens.color.border.subtle }}
            >
              <View className="flex-row items-center gap-3 flex-1">
                <Folder
                  size={20}
                  color={tokens.color.interactive.accent}
                  weight="fill"
                />
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 15,
                    color: tokens.color.text.normal,
                    flex: 1,
                  }}
                >
                  {f}
                </Text>
              </View>
              <CaretRight size={16} color={tokens.color.text.muted} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
