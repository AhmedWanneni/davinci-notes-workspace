import React from "react";
import { ScrollView } from "react-native";
import { ArrowLeft } from "phosphor-react-native";
import { useRouter } from "expo-router";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { ScreenLayout } from "../components/layout";
import { IconButton } from "../components/primitives";
import { VaultSettingsSection } from "../vault/VaultSettingsSection";
import { SyncSettingsPanel } from "../sync/SyncSettingsPanel";

export default function SettingsScreen(): React.ReactElement {
  const router = useRouter();

  return (
    <ScreenLayout
      title="Settings"
      headerLeft={
        <IconButton
          icon={<ArrowLeft size={18} color={darkColorTokens.text.normal} />}
          accessibilityLabel="Back"
          size="sm"
          onPress={() => router.back()}
        />
      }
    >
      <ScrollView
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        <VaultSettingsSection />
        <SyncSettingsPanel />
      </ScrollView>
    </ScreenLayout>
  );
}
