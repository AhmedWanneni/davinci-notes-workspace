import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import {
  X,
  Link,
  BookOpen,
  Code,
  PushPin,
  PencilSimple,
  FolderSimple,
  BookmarkSimple,
  GitMerge,
  PlusCircle,
  ListNumbers,
  GitFork,
  Trash,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Sheet, SheetGroup, Text } from "../primitives";

export interface NoteActionSheetProps {
  visible: boolean;
  onClose: () => void;
  isReadingView?: boolean;
  isPinned?: boolean;
  onToggleReadingView?: () => void;
  onToggleSourceMode?: () => void;
  onOpenBacklinks?: () => void;
  onOpenOutline?: () => void;
  onOpenGraph?: () => void;
  onTogglePin?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onBookmark?: () => void;
  onMerge?: () => void;
  onAddProperty?: () => void;
  onDelete?: () => void;
}

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
  active?: boolean;
}

function ActionRow({
  icon,
  label,
  onPress,
  isLast = false,
  active = false,
}: ActionRowProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center px-4 min-h-[46px]"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: tokens.color.border.subtle,
        backgroundColor: active ? tokens.color.bg.hover : "transparent",
      }}
    >
      <View className="mr-3 w-6 items-center justify-center">{icon}</View>
      <Text
        variant="body"
        color={active ? "accent" : "normal"}
        weight={active ? "semibold" : "regular"}
        className="flex-1"
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function NoteActionSheet({
  visible,
  onClose,
  isReadingView = false,
  isPinned = false,
  onToggleReadingView,
  onToggleSourceMode,
  onOpenBacklinks,
  onOpenOutline,
  onOpenGraph,
  onTogglePin,
  onRename,
  onMove,
  onBookmark,
  onMerge,
  onAddProperty,
  onDelete,
}: NoteActionSheetProps): React.ReactElement {
  const { tokens } = useTheme();
  const iconColor = tokens.color.text.normal;

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {/* Group 1: Close */}
        <SheetGroup>
          <ActionRow
            icon={<X size={20} color={iconColor} weight="bold" />}
            label="Close"
            onPress={onClose}
            isLast
          />
        </SheetGroup>

        {/* Group 2: View Modes, Outline, Backlinks, Graph */}
        <SheetGroup>
          {onOpenOutline ? (
            <ActionRow
              icon={
                <ListNumbers size={20} color={iconColor} weight="regular" />
              }
              label="Outline"
              onPress={onOpenOutline}
            />
          ) : null}
          <ActionRow
            icon={<Link size={20} color={iconColor} weight="regular" />}
            label="Backlinks in document"
            onPress={onOpenBacklinks}
          />
          {onOpenGraph ? (
            <ActionRow
              icon={<GitFork size={20} color={iconColor} weight="regular" />}
              label="Local graph"
              onPress={onOpenGraph}
            />
          ) : null}
          <ActionRow
            icon={<BookOpen size={20} color={iconColor} weight="regular" />}
            label="Reading view"
            onPress={onToggleReadingView}
            active={isReadingView}
          />
          <ActionRow
            icon={<Code size={20} color={iconColor} weight="regular" />}
            label="Source mode"
            onPress={onToggleSourceMode}
            active={!isReadingView}
            isLast
          />
        </SheetGroup>

        {/* Group 3: File Operations */}
        <SheetGroup>
          <ActionRow
            icon={
              <PushPin
                size={20}
                color={iconColor}
                weight={isPinned ? "fill" : "regular"}
              />
            }
            label={isPinned ? "Unpin" : "Pin"}
            onPress={onTogglePin}
            active={isPinned}
          />
          <ActionRow
            icon={<PencilSimple size={20} color={iconColor} weight="regular" />}
            label="Rename..."
            onPress={onRename}
          />
          <ActionRow
            icon={<FolderSimple size={20} color={iconColor} weight="regular" />}
            label="Move file to..."
            onPress={onMove}
          />
          <ActionRow
            icon={
              <BookmarkSimple size={20} color={iconColor} weight="regular" />
            }
            label="Bookmark..."
            onPress={onBookmark}
          />
          <ActionRow
            icon={<GitMerge size={20} color={iconColor} weight="regular" />}
            label="Merge entire file with..."
            onPress={onMerge}
          />
          <ActionRow
            icon={<PlusCircle size={20} color={iconColor} weight="regular" />}
            label="Add file property"
            onPress={onAddProperty}
          />
          {onDelete ? (
            <ActionRow
              icon={
                <Trash
                  size={20}
                  color={tokens.color.text.error}
                  weight="regular"
                />
              }
              label="Delete note"
              onPress={onDelete}
              isLast
            />
          ) : null}
        </SheetGroup>
      </ScrollView>
    </Sheet>
  );
}
