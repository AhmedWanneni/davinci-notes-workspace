import React from "react";
import { View, Modal, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Plus, CaretDown, FileText } from "phosphor-react-native";
import { useTheme } from "../theme";
import { Text } from "./primitives";
import type { MobileTab } from "../vault/tabStore";

export interface TabSwitcherModalProps {
  visible: boolean;
  tabs: MobileTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onDone: () => void;
}

export function TabSwitcherModal({
  visible,
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onDone,
}: TabSwitcherModalProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onDone}
    >
      <View
        className="flex-1 justify-between"
        style={{
          backgroundColor: tokens.color.bg.primary,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Main Grid: 2 columns of tab cards */}
        <ScrollView
          className="flex-1 px-4 pt-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="flex-row flex-wrap justify-between">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const hasSnippet =
                tab.previewText && tab.previewText.trim().length > 0;

              return (
                <View key={tab.id} style={{ width: "47%", marginBottom: 16 }}>
                  <View
                    style={{
                      height: 180,
                      borderRadius: 16,
                      backgroundColor: tokens.color.bg.primary,
                      borderWidth: isActive ? 2 : 1,
                      borderColor: isActive
                        ? tokens.color.interactive.accent
                        : tokens.color.border.subtle,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Top right close button - Sibling positioned at zIndex 10 so it never triggers card selection */}
                    <Pressable
                      onPress={() => onCloseTab(tab.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Close tab ${tab.title}`}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 20,
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: tokens.color.bg.primary,
                      }}
                      className="active:opacity-60"
                    >
                      <X
                        size={16}
                        color={tokens.color.text.normal}
                        weight="bold"
                      />
                    </Pressable>

                    {/* Card Content Pressable */}
                    <Pressable
                      onPress={() => onSelectTab(tab.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Tab ${tab.title}`}
                      style={{
                        flex: 1,
                        padding: 12,
                        paddingTop: 16,
                        justifyContent: "center",
                      }}
                    >
                      {hasSnippet ? (
                        <View className="flex-1 justify-start pt-2">
                          <Text
                            variant="caption"
                            weight="bold"
                            color="normal"
                            numberOfLines={1}
                            style={{ fontSize: 13, marginBottom: 4 }}
                          >
                            {tab.title}
                          </Text>
                          <Text
                            variant="caption"
                            color="muted"
                            numberOfLines={4}
                            style={{ fontSize: 10, lineHeight: 14 }}
                          >
                            {tab.previewText}
                          </Text>
                        </View>
                      ) : (
                        <View className="items-center justify-center">
                          <FileText
                            size={44}
                            color={tokens.color.text.faint}
                            weight="thin"
                          />
                        </View>
                      )}
                    </Pressable>
                  </View>

                  {/* Title underneath the card */}
                  <Text
                    variant="caption"
                    weight="medium"
                    color="normal"
                    numberOfLines={1}
                    className="text-center mt-2"
                    style={{ fontSize: 13 }}
                  >
                    {tab.title}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom bar of Tab Switcher: + on left, N tabs ⌵ in center, Done on right */}
        <View
          className="h-[52px] flex-row items-center justify-between px-6 border-t"
          style={{
            backgroundColor: tokens.color.bg.primary,
            borderTopColor: tokens.color.border.subtle,
          }}
        >
          {/* Left: + Button */}
          <Pressable
            onPress={onNewTab}
            accessibilityRole="button"
            accessibilityLabel="Create new tab"
            className="w-10 h-10 items-center justify-center active:opacity-60"
          >
            <Plus size={22} color={tokens.color.text.normal} weight="regular" />
          </Pressable>

          {/* Center: N tabs ⌵ */}
          <View className="flex-row items-center gap-1">
            <Text
              variant="body"
              weight="semibold"
              color="normal"
              style={{ fontSize: 14 }}
            >
              {tabs.length} {tabs.length === 1 ? "tab" : "tabs"}
            </Text>
            <CaretDown
              size={14}
              color={tokens.color.text.muted}
              weight="bold"
            />
          </View>

          {/* Right: Done button */}
          <Pressable
            onPress={onDone}
            accessibilityRole="button"
            accessibilityLabel="Done"
            className="py-2 px-3 items-center justify-center active:opacity-60"
          >
            <Text
              variant="body"
              weight="bold"
              color="normal"
              style={{ fontSize: 15 }}
            >
              Done
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
