import React from "react";
import { View, Pressable } from "react-native";
import { ArrowLeft } from "phosphor-react-native";
import { useTheme } from "../theme";
import { IconButton, Text } from "./primitives";

export interface EditorHeaderProps {
  title: string;
  payloadBytes: number;
  saveStatus?: "saved" | "saving" | "unsaved" | "error";
  onBack: () => void;
  mode?: "edit" | "preview";
  onToggleMode?: (nextMode: "edit" | "preview") => void;
}

export function EditorHeader({
  title,
  payloadBytes,
  saveStatus = "saved",
  onBack,
  mode = "edit",
  onToggleMode,
}: EditorHeaderProps): React.ReactElement {
  const { tokens } = useTheme();

  const statusLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "error"
        ? "Save failed"
        : saveStatus === "unsaved"
          ? "Unsaved"
          : payloadBytes > 0
            ? `${payloadBytes} B`
            : "Saved";

  const statusColor = saveStatus === "error" ? "error" : "muted";

  return (
    <View
      className="h-[44px] flex-row items-center justify-between px-3 border-b"
      style={{
        backgroundColor: tokens.color.bg["primary-alt"],
        borderBottomColor: tokens.color.border.subtle,
      }}
    >
      <IconButton
        icon={
          <ArrowLeft
            size={20}
            color={tokens.color.text.normal}
            weight="regular"
          />
        }
        accessibilityLabel="Back to files"
        size="sm"
        onPress={onBack}
      />
      <Text
        variant="text"
        weight="semibold"
        color="normal"
        numberOfLines={1}
        className="flex-1 mx-2"
      >
        {title}
      </Text>

      {onToggleMode ? (
        <View
          className="flex-row rounded-lg p-0.5 mr-2"
          style={{
            backgroundColor: tokens.color.bg.secondary,
            borderWidth: 1,
            borderColor: tokens.color.border.subtle,
          }}
        >
          <Pressable
            onPress={() => onToggleMode("edit")}
            className="px-2.5 py-1 rounded-md"
            style={{
              backgroundColor:
                mode === "edit"
                  ? tokens.color.interactive.accent
                  : "transparent",
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "edit" }}
            accessibilityLabel="Edit mode"
          >
            <Text
              variant="caption"
              weight={mode === "edit" ? "bold" : "regular"}
              style={{
                color:
                  mode === "edit"
                    ? tokens.color.text["on-accent"]
                    : tokens.color.text.muted,
                fontSize: 11,
              }}
            >
              Edit
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onToggleMode("preview")}
            className="px-2.5 py-1 rounded-md"
            style={{
              backgroundColor:
                mode === "preview"
                  ? tokens.color.interactive.accent
                  : "transparent",
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "preview" }}
            accessibilityLabel="Preview mode"
          >
            <Text
              variant="caption"
              weight={mode === "preview" ? "bold" : "regular"}
              style={{
                color:
                  mode === "preview"
                    ? tokens.color.text["on-accent"]
                    : tokens.color.text.muted,
                fontSize: 11,
              }}
            >
              Preview
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Text variant="caption" color={statusColor}>
        {statusLabel}
      </Text>
    </View>
  );
}
