import React from "react";
import { View, Pressable, ScrollView, Text } from "react-native";
import {
  X,
  BookOpen,
  Code,
  Check,
  Gear,
  Trash,
  ListNumbers,
  GitFork,
  PencilSimple,
} from "phosphor-react-native";
import { Sheet, SheetGroup } from "../primitives";

export interface NoteActionSheetProps {
  visible: boolean;
  onClose: () => void;
  editorMode?: "note" | "text";
  onSelectMode?: (mode: "note" | "text") => void;
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
  onOpenSettings?: () => void;
}

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
  active?: boolean;
  destructive?: boolean;
}

function ActionRow({
  icon,
  label,
  onPress,
  isLast = false,
  active = false,
  destructive = false,
}: ActionRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center px-4 min-h-[48px] active:bg-gray-100"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#f3f4f6",
        backgroundColor: active ? "#f9fafb" : "#ffffff",
      }}
    >
      <View className="mr-3 w-6 items-center justify-center">{icon}</View>
      <Text
        style={{
          fontSize: 15,
          fontWeight: active ? "600" : "400",
          color: destructive ? "#ef4444" : "#111827",
          flex: 1,
        }}
      >
        {label}
      </Text>
      {active ? <Check size={18} color="#111827" weight="bold" /> : null}
    </Pressable>
  );
}

export function NoteActionSheet({
  visible,
  onClose,
  editorMode,
  onSelectMode,
  isReadingView = false,
  onToggleReadingView,
  onToggleSourceMode,
  onOpenOutline,
  onOpenGraph,
  onRename,
  onDelete,
  onOpenSettings,
}: NoteActionSheetProps): React.ReactElement {
  const activeMode = editorMode ?? (isReadingView ? "note" : "text");

  return (
    <Sheet visible={visible} onClose={onClose} backgroundColor="#ffffff">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8, backgroundColor: "#ffffff" }}
      >
        {/* Group 1: Close */}
        <SheetGroup style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}>
          <ActionRow
            icon={<X size={20} color="#111827" weight="bold" />}
            label="Close"
            onPress={onClose}
            isLast
          />
        </SheetGroup>

        {/* Group 2: Working Actions */}
        <SheetGroup style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}>
          <ActionRow
            icon={<BookOpen size={20} color="#111827" weight="regular" />}
            label="Note mode"
            onPress={() => (onSelectMode ? onSelectMode("note") : onToggleReadingView?.())}
            active={activeMode === "note"}
          />
          <ActionRow
            icon={<Code size={20} color="#111827" weight="regular" />}
            label="Text mode"
            onPress={() => (onSelectMode ? onSelectMode("text") : onToggleSourceMode?.())}
            active={activeMode === "text"}
            isLast={!onOpenOutline && !onOpenGraph && !onRename && !onOpenSettings && !onDelete}
          />
          {onOpenOutline ? (
            <ActionRow
              icon={<ListNumbers size={20} color="#111827" weight="regular" />}
              label="Outline"
              onPress={onOpenOutline}
              isLast={!onOpenGraph && !onRename && !onOpenSettings && !onDelete}
            />
          ) : null}
          {onOpenGraph ? (
            <ActionRow
              icon={<GitFork size={20} color="#111827" weight="regular" />}
              label="Local graph"
              onPress={onOpenGraph}
              isLast={!onRename && !onOpenSettings && !onDelete}
            />
          ) : null}
          {onRename ? (
            <ActionRow
              icon={<PencilSimple size={20} color="#111827" weight="regular" />}
              label="Rename note"
              onPress={onRename}
              isLast={!onOpenSettings && !onDelete}
            />
          ) : null}
          {onOpenSettings ? (
            <ActionRow
              icon={<Gear size={20} color="#111827" weight="regular" />}
              label="Settings"
              onPress={onOpenSettings}
              isLast={!onDelete}
            />
          ) : null}
          {onDelete ? (
            <ActionRow
              icon={<Trash size={20} color="#ef4444" weight="regular" />}
              label="Delete note"
              onPress={onDelete}
              destructive
              isLast
            />
          ) : null}
        </SheetGroup>
      </ScrollView>
    </Sheet>
  );
}
