import React from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CaretLeft,
  CaretRight,
  PlusCircle,
  ArrowsDownUp,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface QuickActionBarProps {
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onNewNote?: () => void;
  onOpenTabs?: () => void;
  tabCount?: number;
  onOpenMore?: () => void;
  onEdit?: () => void;
  onQuickSwitcher?: () => void;
  activeAction?: string;
}

export function QuickActionBar({
  onBack,
  onForward,
  canGoBack = true,
  canGoForward = false,
  onNewNote,
  onOpenTabs,
  tabCount = 1,
  onOpenMore,
  onEdit,
  onQuickSwitcher,
}: QuickActionBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  const handleCenterAction = onNewNote ?? onEdit;
  const handleMoreAction = onOpenMore ?? onQuickSwitcher;

  return (
    <View
      style={{
        backgroundColor: tokens.color.bg.primary,
        borderTopWidth: 1,
        borderTopColor: tokens.color.border.subtle,
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      <View
        style={{
          height: 44,
          maxWidth: 480,
          width: "100%",
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        {/* 1. Back */}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Pressable
            onPress={canGoBack ? onBack : undefined}
            disabled={!canGoBack || !onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: canGoBack ? 1 : 0.35,
            }}
          >
            <CaretLeft
              size={20}
              color={
                canGoBack ? tokens.color.text.normal : tokens.color.text.muted
              }
              weight="bold"
            />
          </Pressable>
        </View>

        {/* 2. Forward */}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Pressable
            onPress={canGoForward ? onForward : undefined}
            disabled={!canGoForward || !onForward}
            accessibilityRole="button"
            accessibilityLabel="Forward"
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: canGoForward ? 1 : 0.35,
            }}
          >
            <CaretRight
              size={20}
              color={
                canGoForward
                  ? tokens.color.text.normal
                  : tokens.color.text.muted
              }
              weight="bold"
            />
          </Pressable>
        </View>

        {/* 3. Plus Action */}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Pressable
            onPress={handleCenterAction}
            accessibilityRole="button"
            accessibilityLabel="New note"
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PlusCircle
              size={28}
              color={tokens.color.interactive.accent}
              weight="bold"
            />
          </Pressable>
        </View>

        {/* 4. Tabs Box [ 1 ] */}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Pressable
            onPress={onOpenTabs}
            accessibilityRole="button"
            accessibilityLabel={`Open tabs (${tabCount})`}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: tokens.color.text.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: tokens.color.text.muted,
                  includeFontPadding: false,
                  lineHeight: 14,
                }}
              >
                {String(tabCount)}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* 5. More / Switcher */}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Pressable
            onPress={handleMoreAction}
            accessibilityRole="button"
            accessibilityLabel="More options"
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowsDownUp
              size={20}
              color={tokens.color.text.normal}
              weight="bold"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
