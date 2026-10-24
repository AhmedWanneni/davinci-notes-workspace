import React from "react";
import { ScrollView } from "react-native";
import { ArrowLeft } from "phosphor-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../theme";
import { ScreenLayout } from "../components/layout";
import { IconButton } from "../components/primitives";
import { VaultSettingsSection } from "../vault/VaultSettingsSection";
import { SyncSettingsPanel } from "../sync/SyncSettingsPanel";
import {
  ThemeSettingsSection,
  ImmersiveModeSection,
} from "../components/settings";

export default function SettingsScreen(): React.ReactElement {
  const router = useRouter();
  const { tokens } = useTheme();

  return (
    <ScreenLayout
      title="Settings"
      headerLeft={
        <IconButton
          icon={<ArrowLeft size={18} color={tokens.color.text.normal} />}
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
        <ThemeSettingsSection />
        <ImmersiveModeSection />
        <VaultSettingsSection />
        <SyncSettingsPanel />
      </ScrollView>
    </ScreenLayout>
  );
}
