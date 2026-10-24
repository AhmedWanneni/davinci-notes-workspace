import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../theme";
import { Text } from "../components/primitives";
import { defaultVaultManager, defaultNoteStore } from "../vault";
import { captureItem, fetchUrlMetadata, type CapturedItem } from "../capture";

/**
 * Receiver screen for incoming OS Share Sheet intents.
 * Works whether the app is launched cold, backgrounded, or active.
 */
export default function ShareTargetScreen(): React.ReactElement {
  const router = useRouter();
  const { tokens } = useTheme();
  const params = useLocalSearchParams<{
    text?: string;
    url?: string;
    title?: string;
    imageUri?: string;
    mimeType?: string;
  }>();

  const [status, setStatus] = useState<string>("Capturing shared content...");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) {
        if (mounted) setStatus("Vault not ready.");
        return;
      }

      let itemType: CapturedItem["type"] = "text";
      let resolvedTitle = params.title;

      if (params.imageUri) {
        itemType = "image";
      } else if (params.url) {
        itemType = "url";
        if (!resolvedTitle) {
          const meta = await fetchUrlMetadata(params.url);
          resolvedTitle = meta.title;
        }
      }

      const item: CapturedItem = {
        type: itemType,
        text: params.text,
        url: params.url,
        title: resolvedTitle,
        fileUri: params.imageUri,
        mimeType: params.mimeType,
        timestamp: Date.now(),
      };

      try {
        const result = await captureItem(adapter, item, "quick-notes");
        if (mounted) {
          setStatus(`Captured to ${result.targetNotePath}!`);
          setTimeout(() => {
            const targetId = defaultNoteStore.register(result.targetNotePath);
            router.replace({
              pathname: "/editor",
              params: {
                path: result.targetNotePath,
                noteId: targetId,
                autoFocus: "1",
              },
            });
          }, 400);
        }
      } catch (err) {
        if (mounted) {
          setStatus(
            `Capture failed: ${err instanceof Error ? err.message : "Unknown"}`,
          );
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [params, router]);

  return (
    <View
      className="flex-1 items-center justify-center p-6"
      style={{ backgroundColor: tokens.color.bg.primary }}
    >
      <ActivityIndicator size="small" color={tokens.color.interactive.accent} />
      <Text variant="body" color="normal" className="mt-4 text-center">
        {status}
      </Text>
    </View>
  );
}
