import React from "react";
import { ScrollView, Pressable, View } from "react-native";
import {
  Tag,
  Paperclip,
  TextH,
  TextB,
  TextItalic,
  TextStrikethrough,
  Code,
  TextIndent,
  TextOutdent,
  Camera,
  Microphone,
  ArrowBendUpLeft,
  ArrowBendUpRight,
} from "phosphor-react-native";
import { useTheme } from "../theme";
import { Text } from "./primitives";
import type { ToolbarActionType } from "../src/bridgeProtocol";

export interface FormattingToolbarProps {
  onAction: (action: ToolbarActionType) => void;
  disabled?: boolean;
}

interface ToolbarItem {
  action: ToolbarActionType;
  label: string;
  icon?: (color: string) => React.ReactNode;
  ariaLabel: string;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { action: "checkbox", label: "[ ]", ariaLabel: "Insert task checkbox" },
  { action: "wikilink", label: "[[ ]]", ariaLabel: "Insert wikilink" },
  {
    action: "tag",
    label: "#",
    icon: (c) => <Tag size={18} color={c} weight="regular" />,
    ariaLabel: "Insert tag",
  },
  {
    action: "photo",
    label: "Att",
    icon: (c) => <Paperclip size={18} color={c} weight="regular" />,
    ariaLabel: "Add attachment",
  },
  {
    action: "heading",
    label: "H",
    icon: (c) => <TextH size={18} color={c} weight="bold" />,
    ariaLabel: "Format heading",
  },
  {
    action: "bold",
    label: "B",
    icon: (c) => <TextB size={18} color={c} weight="bold" />,
    ariaLabel: "Format bold",
  },
  {
    action: "italic",
    label: "I",
    icon: (c) => <TextItalic size={18} color={c} weight="regular" />,
    ariaLabel: "Format italic",
  },
  {
    action: "strikethrough",
    label: "S",
    icon: (c) => <TextStrikethrough size={18} color={c} weight="regular" />,
    ariaLabel: "Format strikethrough",
  },
  {
    action: "code",
    label: "<>",
    icon: (c) => <Code size={18} color={c} weight="regular" />,
    ariaLabel: "Format code",
  },
  {
    action: "indent",
    label: "->",
    icon: (c) => <TextIndent size={18} color={c} weight="regular" />,
    ariaLabel: "Indent",
  },
  {
    action: "outdent",
    label: "<-",
    icon: (c) => <TextOutdent size={18} color={c} weight="regular" />,
    ariaLabel: "Outdent",
  },
  {
    action: "camera",
    label: "Cam",
    icon: (c) => <Camera size={18} color={c} weight="regular" />,
    ariaLabel: "Take photo",
  },
  {
    action: "audio",
    label: "Mic",
    icon: (c) => <Microphone size={18} color={c} weight="regular" />,
    ariaLabel: "Record voice memo",
  },
  {
    action: "undo",
    label: "Undo",
    icon: (c) => <ArrowBendUpLeft size={18} color={c} weight="bold" />,
    ariaLabel: "Undo",
  },
  {
    action: "redo",
    label: "Redo",
    icon: (c) => <ArrowBendUpRight size={18} color={c} weight="bold" />,
    ariaLabel: "Redo",
  },
];

export function FormattingToolbar({
  onAction,
  disabled = false,
}: FormattingToolbarProps): React.ReactElement {
  const { tokens } = useTheme();
  const iconColor = disabled
    ? tokens.color.text.muted
    : tokens.color.text.normal;

  return (
    <View
      className="border-t py-1.5 px-2"
      style={{
        backgroundColor: tokens.color.bg.secondary,
        borderTopWidth: 1,
        borderTopColor: tokens.color.border.subtle,
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
        {TOOLBAR_ITEMS.map((item) => (
          <Pressable
            key={item.action}
            disabled={disabled}
            onPress={() => onAction(item.action)}
            accessibilityRole="button"
            accessibilityLabel={item.ariaLabel}
            className="rounded-lg items-center justify-center border active:opacity-75"
            style={{
              height: 44,
              minWidth: 44,
              paddingHorizontal: 8,
              backgroundColor: tokens.color.bg.primary,
              borderColor: tokens.color.border.subtle,
            }}
          >
            {item.icon ? (
              item.icon(iconColor)
            ) : (
              <Text
                size="sm"
                weight="semibold"
                color={disabled ? "muted" : "normal"}
              >
                {item.label}
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
