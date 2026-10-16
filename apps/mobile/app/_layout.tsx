import React from "react";
import { Stack } from "expo-router";

export default function RootLayout(): React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTintColor: "#222222",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "DaVinci Notes",
        }}
      />
      <Stack.Screen
        name="editor"
        options={{
          title: "Note Editor",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
