import React from "react";
import { View, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  Plus,
  List,
} from "phosphor-react-native";
import { useTheme } from "../theme";
import { Text } from "./primitives";

export interface EditorBottomBarProps {
  onBack: () => void;
  onForward?: () => void;
  onSearch: () => void;
  onNewNote: () => void;
  onTabs?: () => void;
  onMenu: () => void;
  tabCount?: number;
}

export function EditorBottomBar({
  onBack,
  onForward,
  onSearch,
  onNewNote,
  onTabs,
  onMenu,
  tabCount = 1,
}: EditorBottomBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const bottomPadding = Platform.OS === "android" ? 0 : insets.bottom;

  return (
    <View
      className="flex-row items-center justify-around px-4 border-t"
      style={{
        height: 50 + bottomPadding,
        paddingBottom: bottomPadding,
        backgroundColor: tokens.color.bg.primary,
        borderTopColor: tokens.color.border.subtle,
      }}
    >
      {/* 1. Back button */}
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Navigate back"
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <CaretLeft size={22} color="#000000" weight="regular" />
      </Pressable>

      {/* 2. Forward button */}
      <Pressable
        onPress={onForward}
        accessibilityRole="button"
        accessibilityLabel="Navigate forward"
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <CaretRight size={22} color="#000000" weight="regular" />
      </Pressable>

      {/* 3. Search button */}
      <Pressable
        onPress={onSearch}
        accessibilityRole="button"
        accessibilityLabel="Search notes"
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <MagnifyingGlass
          size={22}
          color="#000000"
          weight="regular"
        />
      </Pressable>

      {/* 4. New Note button */}
      <Pressable
        onPress={onNewNote}
        accessibilityRole="button"
        accessibilityLabel="Create new note"
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <Plus size={22} color="#000000" weight="regular" />
      </Pressable>

      {/* 5. Tab switcher [ 1 ] */}
      <Pressable
        onPress={onTabs}
        accessibilityRole="button"
        accessibilityLabel={`Open notes (${tabCount})`}
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            borderWidth: 1.5,
            borderColor: "#000000",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#000000",
              lineHeight: 13,
            }}
          >
            {tabCount}
          </Text>
        </View>
      </Pressable>

      {/* 6. Hamburger Menu button (opens Settings) */}
      <Pressable
        onPress={onMenu}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        className="w-10 h-10 items-center justify-center active:opacity-60"
      >
        <List size={22} color="#000000" weight="regular" />
      </Pressable>
    </View>
  );
}
