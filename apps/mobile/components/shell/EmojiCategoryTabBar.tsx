import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import {
  Smiley,
  PawPrint,
  ForkKnife,
  SoccerBall,
  Car,
  Lightbulb,
  Heart,
  Flag,
} from "phosphor-react-native";
import { useTheme } from "../../theme";

export interface EmojiCategoryTabBarProps {
  activeKey: string;
  onSelectCategory: (key: string) => void;
}

const TABS = [
  { key: "smileys", label: "Smileys & people", icon: Smiley },
  { key: "animals", label: "Animals & nature", icon: PawPrint },
  { key: "food", label: "Food & drink", icon: ForkKnife },
  { key: "activities", label: "Activities", icon: SoccerBall },
  { key: "travel", label: "Travel & places", icon: Car },
  { key: "objects", label: "Objects", icon: Lightbulb },
  { key: "symbols", label: "Symbols", icon: Heart },
  { key: "flags", label: "Flags", icon: Flag },
];

export function EmojiCategoryTabBar({
  activeKey,
  onSelectCategory,
}: EmojiCategoryTabBarProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View
      className="flex-row items-center border-b px-2 py-1"
      style={{ borderBottomColor: tokens.color.border.subtle }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: "center", gap: 4 }}
      >
        {TABS.map(({ key, label, icon: TabIcon }) => {
          const isActive = activeKey === key;
          return (
            <Pressable
              key={key}
              onPress={() => onSelectCategory(key)}
              accessibilityRole="button"
              accessibilityLabel={label}
              className="w-10 h-10 items-center justify-center rounded-lg active:opacity-70"
              style={{
                backgroundColor: isActive
                  ? tokens.color.bg.secondary
                  : "transparent",
              }}
            >
              <TabIcon
                size={20}
                color={
                  isActive
                    ? tokens.color.interactive.accent
                    : tokens.color.text.muted
                }
                weight={isActive ? "fill" : "regular"}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
