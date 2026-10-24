import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import {
  FilePlus,
  Calendar,
  FolderPlus,
  Camera,
  Image as ImageIcon,
  Microphone,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Sheet, SheetGroup, Text } from "../primitives";

export interface CreateActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onNewNote: () => void;
  onDailyNote: () => void;
  onNewFolder?: () => void;
  onTakePhoto: () => void;
  onPickImage: () => void;
  onRecordAudio: () => void;
}

export function CreateActionSheet({
  visible,
  onClose,
  onNewNote,
  onDailyNote,
  onNewFolder,
  onTakePhoto,
  onPickImage,
  onRecordAudio,
}: CreateActionSheetProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <Sheet visible={visible} onClose={onClose} title="Create & Fast Capture">
      <ScrollView showsVerticalScrollIndicator={false}>
        <SheetGroup>
          <Pressable
            onPress={() => {
              onNewNote();
              onClose();
            }}
            className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] active:bg-bg-hover"
            accessibilityRole="button"
          >
            <FilePlus size={20} color={tokens.color.interactive.accent} />
            <View className="flex-1">
              <Text variant="body" color="normal" weight="semibold">
                New Note
              </Text>
              <Text variant="caption" color="muted">
                Create an empty markdown note
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => {
              onDailyNote();
              onClose();
            }}
            className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] border-t active:bg-bg-hover"
            style={{ borderTopColor: tokens.color.border.subtle }}
            accessibilityRole="button"
          >
            <Calendar size={20} color={tokens.color.interactive.accent} />
            <View className="flex-1">
              <Text variant="body" color="normal" weight="semibold">
                Today's Daily Note
              </Text>
              <Text variant="caption" color="muted">
                Open or create daily journal entry
              </Text>
            </View>
          </Pressable>
          {onNewFolder ? (
            <Pressable
              onPress={() => {
                onClose();
                onNewFolder();
              }}
              className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] border-t active:bg-bg-hover"
              style={{ borderTopColor: tokens.color.border.subtle }}
              accessibilityRole="button"
            >
              <FolderPlus size={20} color={tokens.color.interactive.accent} />
              <View className="flex-1">
                <Text variant="body" color="normal" weight="semibold">
                  New Folder
                </Text>
                <Text variant="caption" color="muted">
                  Create a new folder in vault
                </Text>
              </View>
            </Pressable>
          ) : null}
        </SheetGroup>

        <SheetGroup>
          <Pressable
            onPress={() => {
              onTakePhoto();
              onClose();
            }}
            className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] active:bg-bg-hover"
            accessibilityRole="button"
          >
            <Camera size={20} color={tokens.color.text.normal} />
            <Text variant="body" color="normal">
              Take Photo with Camera
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onPickImage();
              onClose();
            }}
            className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] border-t active:bg-bg-hover"
            style={{ borderTopColor: tokens.color.border.subtle }}
            accessibilityRole="button"
          >
            <ImageIcon size={20} color={tokens.color.text.normal} />
            <Text variant="body" color="normal">
              Attach Image from Library
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onRecordAudio();
              onClose();
            }}
            className="flex-row items-center gap-3 px-4 py-3 min-h-[44px] border-t active:bg-bg-hover"
            style={{ borderTopColor: tokens.color.border.subtle }}
            accessibilityRole="button"
          >
            <Microphone size={20} color={tokens.color.text.normal} />
            <Text variant="body" color="normal">
              Record Voice Memo
            </Text>
          </Pressable>
        </SheetGroup>
      </ScrollView>
    </Sheet>
  );
}
