import React, { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import {
  ArrowLeft,
  PaintBrush,
  ArrowsClockwise,
  Folder,
} from "phosphor-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../theme";
import { ScreenLayout } from "../components/layout";
import { IconButton, Text } from "../components/primitives";
import { EditorBottomBar } from "../components/EditorBottomBar";
import { VaultSettingsSection } from "../vault/VaultSettingsSection";
import { SyncSettingsPanel } from "../sync/SyncSettingsPanel";
import {
  ThemeSettingsSection,
  ImmersiveModeSection,
} from "../components/settings";

type SettingsCategory = "theme" | "sync" | "vault";

export default function SettingsScreen(): React.ReactElement {
  const router = useRouter();
  const { tokens } = useTheme();
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>("theme");

  const categories: {
    key: SettingsCategory;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "theme",
      label: "Theme",
      icon: (
        <PaintBrush
          size={18}
          color={
            activeCategory === "theme"
              ? tokens.color.text["on-accent"]
              : tokens.color.text.normal
          }
          weight="regular"
        />
      ),
    },
    {
      key: "sync",
      label: "Sync",
      icon: (
        <ArrowsClockwise
          size={18}
          color={
            activeCategory === "sync"
              ? tokens.color.text["on-accent"]
              : tokens.color.text.normal
          }
          weight="regular"
        />
      ),
    },
    {
      key: "vault",
      label: "Vault",
      icon: (
        <Folder
          size={18}
          color={
            activeCategory === "vault"
              ? tokens.color.text["on-accent"]
              : tokens.color.text.normal
          }
          weight="regular"
        />
      ),
    },
  ];

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
      {/* Category Tabs Bar */}
      <View
        className="flex-row items-center px-4 py-2 gap-2"
        style={{
          backgroundColor: tokens.color.bg.primary,
        }}
      >
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setActiveCategory(cat.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${cat.label} settings`}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg active:opacity-75"
              style={{
                backgroundColor: isSelected
                  ? tokens.color.interactive.accent
                  : tokens.color.bg.secondary,
              }}
            >
              {cat.icon}
              <Text
                variant="caption"
                weight={isSelected ? "bold" : "medium"}
                style={{
                  color: isSelected
                    ? tokens.color.text["on-accent"]
                    : tokens.color.text.normal,
                  fontSize: 12,
                }}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Category Content */}
      <ScrollView
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        {activeCategory === "theme" ? (
          <>
            <ThemeSettingsSection />
            <ImmersiveModeSection />
          </>
        ) : null}

        {activeCategory === "sync" ? <SyncSettingsPanel /> : null}

        {activeCategory === "vault" ? <VaultSettingsSection /> : null}
      </ScrollView>

      {/* Editor Navigation Bar */}
      <EditorBottomBar
        onTodo={() => router.push("/todos")}
        onNewNote={() =>
          router.push({
            pathname: "/editor",
            params: { preset: "new", autoFocus: "1" },
          })
        }
        onSearch={() => router.push("/search")}
        onNotifications={() =>
          router.push({ pathname: "/todos", params: { tab: "reminders" } })
        }
        onTabs={() => router.push("/editor")}
        onMenu={() => {}}
        tabCount={1}
      />
    </ScreenLayout>
  );
}
