import "../global.css";
import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text, Button } from "../components/primitives";
import { defaultVaultManager } from "../vault/vaultManager";
import { MobileThemeProvider, useTheme } from "../theme";
import { loadImmersiveModeFromDb } from "../settings";

SplashScreen.preventAutoHideAsync().catch(() => {});

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}): React.ReactElement {
  SplashScreen.hideAsync().catch(() => {});

  return (
    <View className="flex-1 bg-bg-primary items-center justify-center p-6">
      <View className="p-5 rounded-card border border-border-status-error bg-bg-secondary max-w-sm w-full">
        <Text variant="h2" color="error" className="mb-2">
          Application Error
        </Text>
        <Text variant="caption" color="muted" className="mb-4">
          {error.message || "An unexpected error occurred during startup."}
        </Text>
        <Button variant="primary" size="md" onPress={retry}>
          Try Again
        </Button>
      </View>
    </View>
  );
}

function RootNavigator(): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: tokens.color.bg.primary,
        },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="note"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="editor"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="gallery"
        options={{
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout(): React.ReactElement {
  useEffect(() => {
    async function hideSplashAfterInitialShell() {
      try {
        await defaultVaultManager.getRegistry().catch(() => {});
        await loadImmersiveModeFromDb().catch(() => {});
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    hideSplashAfterInitialShell();
  }, []);

  return (
    <SafeAreaProvider>
      <MobileThemeProvider>
        <RootNavigator />
      </MobileThemeProvider>
    </SafeAreaProvider>
  );
}
