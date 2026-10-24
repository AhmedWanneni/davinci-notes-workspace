import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../theme";
import { Text } from "../components/primitives";

/**
 * Fast entry point for "New note" widget / home screen shortcut.
 * Immediately redirects into the editor with keyboard raised.
 */
export default function NewNoteActionScreen(): React.ReactElement {
  const router = useRouter();
  const { tokens } = useTheme();

  useEffect(() => {
    // Navigate straight to editor with "new" preset and keyboard focused
    router.replace({
      pathname: "/editor",
      params: { preset: "new" },
    });
  }, [router]);

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: tokens.color.bg.primary }}
    >
      <Text variant="caption" color="muted">
        Opening new note...
      </Text>
    </View>
  );
}
