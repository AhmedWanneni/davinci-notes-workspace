import React from "react";
import { View, Pressable } from "react-native";
import {
  SidebarSimple,
  PencilSimple,
  BookOpen,
  DotsThreeVertical,
  CaretDown,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface MobileHeaderProps {
  title: string;
  folder?: string;
  onToggleSidebar?: () => void;
  onToggleReadingView?: () => void;
  isReadingView?: boolean;
  onOpenMoreMenu?: () => void;
  onTitlePress?: () => void;
  showTitleDropdown?: boolean;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
}

export function MobileHeader({
  title,
  folder,
  onToggleSidebar,
  onToggleReadingView,
  isReadingView = false,
  onOpenMoreMenu,
  onTitlePress,
  showTitleDropdown = false,
  leftAccessory,
  rightAccessory,
}: MobileHeaderProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View
      style={{
        height: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        backgroundColor: tokens.color.bg.primary,
        borderBottomWidth: 1,
        borderBottomColor: tokens.color.border.subtle,
      }}
    >
      <View style={{ width: 44, height: 44, justifyContent: "center" }}>
        {leftAccessory ? (
          leftAccessory
        ) : (
          <Pressable
            onPress={onToggleSidebar}
            disabled={!onToggleSidebar}
            accessibilityRole="button"
            accessibilityLabel="Toggle navigation sidebar"
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SidebarSimple
              size={20}
              color={tokens.color.interactive.accent}
              weight="regular"
            />
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={onTitlePress}
        disabled={!onTitlePress}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 8,
        }}
        accessibilityRole={onTitlePress ? "button" : "header"}
        accessibilityLabel={folder ? `${folder} / ${title}` : title}
      >
        {folder ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              color: tokens.color.text.muted,
              maxWidth: 120,
            }}
          >
            {folder} /{" "}
          </Text>
        ) : null}
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: tokens.color.text.normal,
          }}
        >
          {title}
        </Text>
        {showTitleDropdown ? (
          <View style={{ marginLeft: 4 }}>
            <CaretDown
              size={12}
              color={tokens.color.text.muted}
              weight="bold"
            />
          </View>
        ) : null}
      </Pressable>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          minWidth: 44,
        }}
      >
        {rightAccessory ? (
          rightAccessory
        ) : (
          <>
            {onToggleReadingView ? (
              <Pressable
                onPress={onToggleReadingView}
                accessibilityRole="button"
                accessibilityLabel={
                  isReadingView
                    ? "Switch to edit mode"
                    : "Switch to reading view"
                }
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isReadingView ? (
                  <PencilSimple
                    size={20}
                    color={tokens.color.interactive.accent}
                    weight="regular"
                  />
                ) : (
                  <BookOpen
                    size={20}
                    color={tokens.color.interactive.accent}
                    weight="regular"
                  />
                )}
              </Pressable>
            ) : null}
            {onOpenMoreMenu ? (
              <Pressable
                onPress={onOpenMoreMenu}
                accessibilityRole="button"
                accessibilityLabel="More options"
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DotsThreeVertical
                  size={20}
                  color={tokens.color.interactive.accent}
                  weight="bold"
                />
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}
