import React, { useState } from "react";
import { View, Modal, Pressable, TextInput } from "react-native";
import { X, Clock, Plus, CalendarBlank } from "phosphor-react-native";
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
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="p-6 rounded-t-3xl" style={{ backgroundColor: "#ffffff" }}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: tokens.color.text.normal }}>
                  Add Item
                </Text>
                <Text style={{ fontSize: 12, color: tokens.color.text.muted }}>
                  To {todoListName}
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-1 active:opacity-60">
                <X size={20} color={tokens.color.text.muted} />
              </Pressable>
            </View>

            {/* Item text input */}
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="e.g. Call client, Review pull request..."
              placeholderTextColor={tokens.color.text.muted}
              className="px-4 py-3 rounded-xl border mb-3"
              style={{
                backgroundColor: tokens.color.bg.primary,
                borderColor: tokens.color.border.subtle,
                color: tokens.color.text.normal,
                fontSize: 15,
              }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />

            {/* Reminder Picker Trigger */}
            <Pressable
              onPress={() => setPickerOpen(true)}
              className="flex-row items-center justify-between px-4 py-3 rounded-xl border mb-5 active:opacity-80"
              style={{
                backgroundColor: tokens.color.bg.primary,
                borderColor: reminder ? "#000000" : tokens.color.border.subtle,
              }}
            >
              <View className="flex-row items-center flex-1">
                <Clock size={18} color={reminder ? "#000000" : tokens.color.text.muted} />
                <Text
                  style={{
                    marginLeft: 10,
                    fontSize: 14,
                    color: reminder ? "#111827" : tokens.color.text.muted,
                    fontWeight: reminder ? "600" : "400",
                  }}
                >
                  {reminder ? `Reminder: ${reminder}` : "Set date & time reminder"}
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
              className="py-3.5 rounded-2xl items-center justify-center active:opacity-90 flex-row gap-2"
              style={{
                backgroundColor: text.trim() ? "#000000" : tokens.color.bg.hover,
              }}
            >
              <Plus size={18} color={text.trim() ? "#ffffff" : tokens.color.text.muted} weight="bold" />
              <Text style={{ fontSize: 15, fontWeight: "700", color: text.trim() ? "#ffffff" : tokens.color.text.muted }}>
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
