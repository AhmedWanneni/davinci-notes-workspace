import React, { useState, useMemo } from "react";
import { Modal, View, Pressable, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MagnifyingGlass, Trash, X } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text, Input } from "../primitives";
import {
  EMOJI_CATEGORIES,
  searchEmojis,
  type EmojiEntry,
} from "../../vault/emojiCategories";
import { EmojiCategoryTabBar } from "./EmojiCategoryTabBar";

export interface FolderEmojiPickerModalProps {
  visible: boolean;
  folderName: string;
  currentEmoji?: string;
  onClose: () => void;
  onSelectEmoji: (emoji: string | null) => void;
}

export function FolderEmojiPickerModal({
  visible,
  folderName,
  currentEmoji,
  onClose,
  onSelectEmoji,
}: FolderEmojiPickerModalProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [activeTab, setActiveTab] = useState("smileys");
  const [searchQuery, setSearchQuery] = useState("");

  const folderBase = folderName.split("/").pop() ?? folderName;

  const displayedEmojis = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return searchEmojis(searchQuery);
    }
    const cat = EMOJI_CATEGORIES.find((c) => c.key === activeTab);
    return cat ? cat.emojis : [];
  }, [searchQuery, activeTab]);

  const handleSelect = (emoji: string) => {
    onSelectEmoji(emoji);
    onClose();
  };

  const handleRemove = () => {
    onSelectEmoji(null);
    onClose();
  };

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
            accessibilityLabel="Close emoji picker"
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
              Choose Folder Icon
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontSize: 12, color: tokens.color.text.muted }}
            >
              {folderBase}
            </Text>
          </View>

          {currentEmoji ? (
            <Pressable
              onPress={handleRemove}
              accessibilityRole="button"
              accessibilityLabel="Remove folder emoji"
              className="flex-row items-center gap-1 px-2 py-1 rounded-lg active:opacity-60"
            >
              <Trash size={16} color={tokens.color.text.error} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: tokens.color.text.error,
                }}
              >
                Remove
              </Text>
            </Pressable>
          ) : (
            <View className="w-9" />
          )}
        </View>

        {/* Search Bar */}
        <View className="px-4 py-2">
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search all emojis..."
            placeholderTextColor={tokens.color.text.muted}
            prefix={
              <MagnifyingGlass size={18} color={tokens.color.text.muted} />
            }
            suffix={
              searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")} className="p-1">
                  <X size={16} color={tokens.color.text.muted} weight="bold" />
                </Pressable>
              ) : null
            }
          />
        </View>

        {/* Desktop-parity 8-category tab bar */}
        {searchQuery.trim().length === 0 ? (
          <EmojiCategoryTabBar
            activeKey={activeTab}
            onSelectCategory={setActiveTab}
          />
        ) : null}

        {/* Emojis Grid (7 columns) */}
        <FlatList<EmojiEntry>
          data={displayedEmojis}
          keyExtractor={(item, index) => `${item.emoji}-${index}`}
          numColumns={7}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 8,
            paddingVertical: 12,
            alignItems: "center",
          }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item.emoji)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              className="w-12 h-12 items-center justify-center rounded-xl m-0.5 active:bg-bg-hover active:scale-95"
            >
              <Text style={{ fontSize: 26, textAlign: "center" }}>
                {item.emoji}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="p-8 items-center justify-center">
              <Text style={{ fontSize: 14, color: tokens.color.text.muted }}>
                No emoji found for "{searchQuery}"
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}
