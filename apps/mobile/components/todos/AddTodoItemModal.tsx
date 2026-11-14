import React, { useState } from "react";
import { View, Modal, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Clock,
  Plus,
  CalendarBlank,
  X,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { DateTimePickerModal } from "./DateTimePickerModal";

export interface AddTodoItemModalProps {
  visible: boolean;
  todoListName: string;
  onClose: () => void;
  onAddItem: (text: string, duration?: string, reminder?: string) => void;
}

export function AddTodoItemModal({
  visible,
  todoListName,
  onClose,
  onAddItem,
}: AddTodoItemModalProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [text, setText] = useState("");
  const [reminder, setReminder] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const reminderStr = reminder.trim() ? reminder.trim() : undefined;
    onAddItem(trimmed, undefined, reminderStr);
    setText("");
    setReminder("");
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <View
          className="flex-1"
          style={{
            backgroundColor: tokens.color.bg.primary,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
        >
          {/* Fullscreen Header */}
          <View
            className="flex-row items-center justify-between px-4 py-3 border-b"
            style={{ borderBottomColor: tokens.color.border.subtle }}
          >
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="w-9 h-9 items-center justify-center -ml-1 rounded-lg active:opacity-60"
            >
              <ArrowLeft size={22} color={tokens.color.text.normal} />
            </Pressable>

            <View className="items-center flex-1 mx-2">
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: tokens.color.text.normal,
                }}
              >
                Add Item
              </Text>
              <Text
                numberOfLines={1}
                style={{ fontSize: 12, color: tokens.color.text.muted }}
              >
                To {todoListName}
              </Text>
            </View>

            <Pressable
              onPress={handleAdd}
              disabled={!text.trim()}
              className="px-3 py-1.5 rounded-lg active:opacity-75"
              style={{
                backgroundColor: text.trim()
                  ? tokens.color.interactive.accent
                  : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: text.trim()
                    ? tokens.color.text["on-accent"]
                    : tokens.color.text.muted,
                }}
              >
                Save
              </Text>
            </Pressable>
          </View>

          {/* Form Content */}
          <View className="p-4">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="e.g. Call client, Review pull request..."
              placeholderTextColor={tokens.color.text.muted}
              className="px-4 py-3 rounded-xl mb-3"
              style={{
                backgroundColor: tokens.color.bg.secondary,
                color: tokens.color.text.normal,
                fontSize: 16,
              }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />

            {/* Reminder Picker Trigger */}
            <Pressable
              onPress={() => setPickerOpen(true)}
              className="flex-row items-center justify-between px-4 py-3 rounded-xl mb-5 active:opacity-80"
              style={{ backgroundColor: tokens.color.bg.secondary }}
            >
              <View className="flex-row items-center flex-1">
                <Clock
                  size={18}
                  color={
                    reminder
                      ? tokens.color.interactive.accent
                      : tokens.color.text.muted
                  }
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    color: reminder
                      ? tokens.color.text.normal
                      : tokens.color.text.muted,
                    fontWeight: reminder ? "600" : "400",
                  }}
                >
                  {reminder
                    ? `Reminder: ${reminder}`
                    : "Set date & time reminder"}
                </Text>
              </View>
              {reminder ? (
                <Pressable
                  hitSlop={8}
                  onPress={(e) => {
                    e.stopPropagation();
                    setReminder("");
                  }}
                  className="p-1"
                >
                  <X size={15} color={tokens.color.text.muted} />
                </Pressable>
              ) : (
                <CalendarBlank size={16} color={tokens.color.text.muted} />
              )}
            </Pressable>

            {/* Action Button */}
            <Pressable
              onPress={handleAdd}
              disabled={!text.trim()}
              className="py-3.5 rounded-xl items-center justify-center active:opacity-90 flex-row gap-2"
              style={{
                backgroundColor: text.trim()
                  ? tokens.color.interactive.accent
                  : tokens.color.bg.secondary,
              }}
            >
              <Plus
                size={18}
                color={
                  text.trim()
                    ? tokens.color.text["on-accent"]
                    : tokens.color.text.muted
                }
                weight="bold"
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: text.trim()
                    ? tokens.color.text["on-accent"]
                    : tokens.color.text.muted,
                }}
              >
                Add to {todoListName}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={(val) => setReminder(val)}
      />
    </>
  );
}
