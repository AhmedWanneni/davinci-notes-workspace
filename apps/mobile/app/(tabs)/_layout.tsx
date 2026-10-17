import React from "react";
import { Tabs, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Files, MagnifyingGlass, Plus, Tag } from "phosphor-react-native";
import { darkColorTokens, mobileTokens } from "@app/design-tokens/mobile";
import {
  defaultVaultManager,
  generateUniqueNotePath,
  defaultNoteStore,
} from "../../vault";

export default function TabLayout(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleNewNote = async () => {
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) {
        router.push({
          pathname: "/editor",
          params: { preset: "new", autoFocus: "1" },
        });
        return;
      }
      const uniquePath = await generateUniqueNotePath(adapter, "", "Untitled");
      const noteId = defaultNoteStore.register(uniquePath);
      router.push({
        pathname: "/editor",
        params: { path: uniquePath, noteId, preset: "new", autoFocus: "1" },
      });
    } catch (err) {
      console.error("[tabs] Failed to initialize new note path:", err);
      router.push({
        pathname: "/editor",
        params: { preset: "new", autoFocus: "1" },
      });
    }
  };

  const tabHeight = 52 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: darkColorTokens.bg.secondary,
          borderTopWidth: 1,
          borderTopColor: darkColorTokens.border.normal,
          height: tabHeight,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 4,
          paddingTop: 4,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: darkColorTokens.text.accent,
        tabBarInactiveTintColor: darkColorTokens.text.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Files",
          tabBarIcon: ({ color }) => (
            <Files size={22} color={String(color)} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => (
            <MagnifyingGlass size={22} color={String(color)} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="new-note-action"
        options={{
          title: "",
          tabBarButton: () => (
            <View className="items-center justify-center -top-1">
              <Pressable
                onPress={handleNewNote}
                accessibilityRole="button"
                accessibilityLabel="Create new note"
                className="w-12 h-12 rounded-md bg-interactive-accent items-center justify-center active:opacity-80 border border-border-subtle"
                style={{
                  minWidth: mobileTokens.minTouchTarget,
                  minHeight: mobileTokens.minTouchTarget,
                }}
              >
                <Plus
                  size={22}
                  color={darkColorTokens.text["on-accent"]}
                  weight="regular"
                />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: "Tags",
          tabBarIcon: ({ color }) => (
            <Tag size={22} color={String(color)} weight="regular" />
          ),
        }}
      />
    </Tabs>
  );
}
