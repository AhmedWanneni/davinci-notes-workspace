import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../components/primitives";
import { defaultVaultManager } from "../vault";
import { ensureDailyNote } from "../capture/dailyNoteService";

/**
 * Fast entry point for "Today's note" widget / home screen shortcut.
 * Ensures today's daily note exists (creating if missing) and opens it.
 */
export default function DailyNoteActionScreen(): React.ReactElement {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;

      const res = await ensureDailyNote(adapter);
      if (mounted) {
        router.replace({
          pathname: "/editor",
          params: { path: res.path },
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <View className="flex-1 bg-bg-primary items-center justify-center">
      <Text variant="caption" color="muted">
        Opening today's note...
      </Text>
    </View>
  );
}
