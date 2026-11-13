import React from "react";
import { View } from "react-native";
import { User, Sparkle } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface TodoHeaderProps {
  userName?: string;
  date?: Date;
}

export function TodoHeader({
  userName = "User",
  date = new Date(),
}: TodoHeaderProps): React.ReactElement {
  const { tokens } = useTheme();

  const getGreeting = () => {
    const hour = date.getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  };

  const formatDate = (d: Date) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  };

  return (
    <View className="flex-row items-center justify-between px-6 pt-3 pb-2">
      <View>
        <Text
          style={{
            fontSize: 26,
            fontWeight: "700",
            color: tokens.color.text.normal,
            letterSpacing: -0.5,
          }}
        >
          {`${getGreeting()}, ${userName}`}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "400",
            color: tokens.color.text.muted,
            marginTop: 4,
          }}
        >
          {formatDate(date)}
        </Text>
      </View>

      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "#fce9d8",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1.5,
          borderColor: "#e8b894",
        }}
      >
        <Sparkle size={22} color="#b85c14" weight="fill" />
      </View>
    </View>
  );
}
