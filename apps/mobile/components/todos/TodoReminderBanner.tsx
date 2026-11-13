import React from "react";
import { View, Pressable } from "react-native";
import { BellRinging } from "phosphor-react-native";
import { Text } from "../primitives";

export interface TodoReminderBannerProps {
  onSetReminder: () => void;
}

export function TodoReminderBanner({
  onSetReminder,
}: TodoReminderBannerProps): React.ReactElement {
  return (
    <View className="px-6 py-2">
      <View
        className="flex-row items-center justify-between p-5 rounded-2xl"
        style={{
          backgroundColor: "#fce9d8",
          borderWidth: 1,
          borderColor: "#f5d3b6",
        }}
      >
        <View className="flex-1 mr-3">
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#38220f",
              marginBottom: 4,
            }}
          >
            Set the reminder
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "400",
              color: "#7a5c43",
              lineHeight: 16,
              marginBottom: 12,
            }}
          >
            Never miss your morning routine!{"\n"}Set a reminder to stay on track
          </Text>

          <Pressable
            onPress={onSetReminder}
            accessibilityRole="button"
            accessibilityLabel="Set reminder now"
            className="self-start px-4 py-2 rounded-full active:opacity-80"
            style={{ backgroundColor: "#4a2810" }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "#ffffff",
              }}
            >
              Set Now
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: "#f7d7be",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BellRinging size={44} color="#d97736" weight="fill" />
        </View>
      </View>
    </View>
  );
}
