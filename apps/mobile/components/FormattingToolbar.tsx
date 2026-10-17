import React from "react";
import { ScrollView, Pressable, View } from "react-native";
import { darkColorTokens, mobileTokens } from "@app/design-tokens/mobile";
import { Text } from "./primitives";
import type { ToolbarActionType } from "../src/bridgeProtocol";

export interface FormattingToolbarProps {
  onAction: (action: ToolbarActionType) => void;
  disabled?: boolean;
}

interface ToolbarButtonSpec {
  action: ToolbarActionType;
  label: string;
  ariaLabel: string;
}

const TOOLBAR_BUTTONS: ToolbarButtonSpec[] = [
  { action: "wikilink", label: "[[ ]]", ariaLabel: "Insert wikilink" },
  { action: "link", label: "Link", ariaLabel: "Insert markdown link" },
  { action: "tag", label: "#Tag", ariaLabel: "Insert tag" },
  { action: "checkbox", label: "☑ Task", ariaLabel: "Insert task checkbox" },
  { action: "camera", label: "📷", ariaLabel: "Take photo with camera" },
  { action: "photo", label: "🖼", ariaLabel: "Attach photo from library" },
  { action: "audio", label: "🎙", ariaLabel: "Record voice memo" },
  { action: "indent", label: "⇥ Indent", ariaLabel: "Indent list item" },
  { action: "outdent", label: "⇤ Outdent", ariaLabel: "Outdent list item" },
  { action: "undo", label: "↶ Undo", ariaLabel: "Undo last change" },
  { action: "redo", label: "↷ Redo", ariaLabel: "Redo change" },
];

export function FormattingToolbar({
  onAction,
  disabled = false,
}: FormattingToolbarProps): React.ReactElement {
  return (
    <View
      className="bg-bg-secondary border-t border-border-subtle py-1 px-2"
      style={{
        backgroundColor: darkColorTokens.bg.secondary,
        borderTopWidth: 1,
        borderTopColor: darkColorTokens.border.subtle,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
      >
        {TOOLBAR_BUTTONS.map((btn) => (
          <Pressable
            key={btn.action}
            disabled={disabled}
            onPress={() => onAction(btn.action)}
            accessibilityRole="button"
            accessibilityLabel={btn.ariaLabel}
            className="px-3 rounded border border-border-normal bg-bg-primary items-center justify-center active:opacity-75"
            style={{
              minHeight: mobileTokens.minTouchTarget,
              minWidth: mobileTokens.minTouchTarget,
              backgroundColor: darkColorTokens.bg.primary,
              borderColor: darkColorTokens.border.normal,
              borderWidth: 1,
            }}
          >
            <Text
              size="sm"
              weight="medium"
              color={disabled ? "muted" : "normal"}
            >
              {btn.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
