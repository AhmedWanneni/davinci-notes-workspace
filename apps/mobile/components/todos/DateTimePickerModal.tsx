import React, { useState } from "react";
import { View, Modal, Pressable, Platform } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { CalendarBlank, Clock, ArrowLeft } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
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
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [date, setDate] = useState<Date>(() => new Date());

  const handleDateChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (selectedDate) setDate(selectedDate);
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.color.bg.primary,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 16,
          justifyContent: "space-between",
        }}
      >
        <View>
          {/* Top Bar */}
          <View
            className="flex-row items-center justify-between py-3 border-b"
            style={{ borderBottomColor: tokens.color.border.subtle }}
          >
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="p-1 active:opacity-60"
            >
              <ArrowLeft size={22} color={tokens.color.text.normal} />
            </Pressable>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "600",
                color: tokens.color.text.normal,
              }}
            >
              Set Date & Time
            </Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Description */}
          <View className="py-6">
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: tokens.color.text.normal,
                marginBottom: 8,
              }}
            >
              Reminder schedule
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: tokens.color.text.muted,
                lineHeight: 20,
              }}
            >
              Select when you want to be notified. Your reminder will also sync
              with Google Calendar.
            </Text>
          </View>

          {/* Platform specific Expo DateTimePicker */}
          {Platform.OS === "android" ? (
            <View className="flex-row gap-3 mb-6">
              <Pressable
                onPress={() => showAndroidMode("date")}
                className="flex-1 flex-row items-center justify-center py-3.5 px-4 rounded-xl border active:opacity-75"
                style={{
                  borderColor: tokens.color.border.subtle,
                  backgroundColor: tokens.color.bg.secondary,
                }}
              >
                <CalendarBlank size={18} color={tokens.color.text.normal} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: tokens.color.text.normal,
                    marginLeft: 8,
                  }}
                >
                  {dateLabel}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => showAndroidMode("time")}
                className="flex-1 flex-row items-center justify-center py-3.5 px-4 rounded-xl border active:opacity-75"
                style={{
                  borderColor: tokens.color.border.subtle,
                  backgroundColor: tokens.color.bg.secondary,
                }}
              >
                <Clock size={18} color={tokens.color.text.normal} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: tokens.color.text.normal,
                    marginLeft: 8,
                  }}
                >
                  {timeLabel}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="items-center my-4">
              <DateTimePicker
                value={date}
                mode="datetime"
                display="spinner"
                onChange={handleDateChange}
                textColor={tokens.color.text.normal}
                themeVariant={tokens.isDark ? "dark" : "light"}
                style={{ height: 200, width: "100%" }}
              />
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={onClose}
            className="flex-1 py-3.5 rounded-xl items-center justify-center border active:opacity-75"
            style={{
              borderColor: tokens.color.border.subtle,
              backgroundColor: tokens.color.bg.secondary,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: tokens.color.text.normal,
              }}
            >
              Cancel
            </Text>
          </Pressable>

          <Pressable
            onPress={handleConfirm}
            className="flex-1 py-3.5 rounded-xl items-center justify-center active:opacity-90"
            style={{ backgroundColor: tokens.color.interactive.accent }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: tokens.color.text["on-accent"],
              }}
            >
              Confirm
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
