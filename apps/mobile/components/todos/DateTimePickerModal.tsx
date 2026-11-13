import React, { useState } from "react";
import { View, Modal, Pressable, Platform } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { CalendarBlank, Clock } from "phosphor-react-native";
import { Text } from "../primitives";

export interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (dateTimeStr: string) => void;
}

export function DateTimePickerModal({
  visible,
  onClose,
  onConfirm,
}: DateTimePickerModalProps): React.ReactElement {
  const [date, setDate] = useState<Date>(() => new Date());

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const showAndroidMode = (currentMode: "date" | "time") => {
    DateTimePickerAndroid.open({
      value: date,
      mode: currentMode,
      is24Hour: false,
      onChange: (_e, selectedDate) => {
        if (selectedDate) setDate(selectedDate);
      },
    });
  };

  const handleConfirm = () => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    onConfirm(`${year}-${month}-${day} ${hours}:${minutes}`);
    onClose();
  };

  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
        <View className="p-6 rounded-t-3xl" style={{ backgroundColor: "#ffffff" }}>
          {/* Header */}
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 6 }}>
            Select a Date & Time
          </Text>
          <Text style={{ fontSize: 14, color: "#6b7280", lineHeight: 20, marginBottom: 20 }}>
            We’ll send reminders before your task so you can prepare.
          </Text>

          {/* Platform specific Expo DateTimePicker */}
          {Platform.OS === "android" ? (
            <View className="flex-row gap-3 mb-6">
              <Pressable
                onPress={() => showAndroidMode("date")}
                className="flex-1 flex-row items-center justify-center py-3.5 px-4 rounded-xl border"
                style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
              >
                <CalendarBlank size={18} color="#111827" />
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#111827", marginLeft: 8 }}>
                  {dateLabel}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => showAndroidMode("time")}
                className="flex-1 flex-row items-center justify-center py-3.5 px-4 rounded-xl border"
                style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
              >
                <Clock size={18} color="#111827" />
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#111827", marginLeft: 8 }}>
                  {timeLabel}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="items-center my-2">
              <DateTimePicker
                value={date}
                mode="datetime"
                display="spinner"
                onChange={handleDateChange}
                textColor="#111827"
                themeVariant="light"
                style={{ height: 180, width: "100%" }}
              />
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row items-center gap-3 mt-4">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3.5 rounded-full items-center justify-center border active:opacity-75"
              style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              className="flex-1 py-3.5 rounded-full items-center justify-center active:opacity-90"
              style={{ backgroundColor: "#000000" }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
