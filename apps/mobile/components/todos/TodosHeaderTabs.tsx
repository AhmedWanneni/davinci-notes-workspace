import React from "react";
import { View, Pressable } from "react-native";
import { List } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface TodosHeaderTabsProps {
  activeTab: "reminders" | "todos";
  onSelectTab: (tab: "reminders" | "todos") => void;
  onOpenSidebar: () => void;
}

export function TodosHeaderTabs({
  activeTab,
  onSelectTab,
  onOpenSidebar,
}: TodosHeaderTabsProps): React.ReactElement {
  const { tokens } = useTheme();
  const isRem = activeTab === "reminders";

  return (
    <View
      className="flex-row items-center px-4 pt-3 pb-2.5"
      style={{ gap: 12 }}
    >
      <Pressable
        onPress={onOpenSidebar}
        accessibilityRole="button"
        accessibilityLabel="Open sidebar"
        className="p-1 -ml-1 active:opacity-60"
      >
        <List size={26} color={tokens.color.text.normal} weight="regular" />
      </Pressable>
      <View
        className="flex-1 flex-row p-1 rounded-xl"
        style={{ backgroundColor: tokens.color.bg.secondary }}
      >
        <Pressable
          onPress={() => onSelectTab("reminders")}
          className="flex-1 py-1.5 rounded-lg items-center justify-center"
          style={{
            backgroundColor: isRem
              ? tokens.color.interactive.accent
              : "transparent",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: isRem
                ? tokens.color.text["on-accent"]
                : tokens.color.text.muted,
            }}
          >
            Reminders & Events
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onSelectTab("todos")}
          className="flex-1 py-1.5 rounded-lg items-center justify-center"
          style={{
            backgroundColor: !isRem
              ? tokens.color.interactive.accent
              : "transparent",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: !isRem
                ? tokens.color.text["on-accent"]
                : tokens.color.text.muted,
            }}
          >
            Todos & Projects
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
