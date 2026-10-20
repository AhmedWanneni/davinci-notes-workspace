import React, { useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Files, MagnifyingGlass, Plus } from "phosphor-react-native";
import { useTheme } from "../../theme";
import {
  defaultVaultManager,
  generateUniqueNotePath,
  defaultNoteStore,
} from "../../vault";
import { CreateActionSheet } from "../../components/shell";
import { useMediaCaptureActions } from "../../capture";

export default function TabLayout(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

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
    } catch {
      router.push({
        pathname: "/editor",
        params: { preset: "new", autoFocus: "1" },
      });
    }
  };

  const handleDailyNote = () => {
    router.push("/daily-note-action");
  };

  const { handleMediaAction } = useMediaCaptureActions((_markdown) => {
    // If media attached from tab layout, open new note with media markdown
    handleNewNote().then(() => {
      // note opened
    });
  });

  const bottomInset = Math.max(insets.bottom, 10);
  const tabHeight = 48 + bottomInset;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: tokens.color.bg.primary,
            borderTopWidth: 1,
            borderTopColor: tokens.color.border.subtle,
            height: tabHeight,
            paddingBottom: bottomInset,
            paddingTop: 4,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: tokens.color.interactive.accent,
          tabBarInactiveTintColor: tokens.color.text.muted,
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
          name="new-note-action"
          options={{
            title: "",
            tabBarButton: () => (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Pressable
                  onPress={handleNewNote}
                  onLongPress={() => setCreateSheetVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Create new note"
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: tokens.color.interactive.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus
                      size={18}
                      color={tokens.color.text["on-accent"]}
                      weight="bold"
                    />
                  </View>
                </Pressable>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color }) => (
              <MagnifyingGlass
                size={22}
                color={String(color)}
                weight="regular"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="tags"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <CreateActionSheet
        visible={createSheetVisible}
        onClose={() => setCreateSheetVisible(false)}
        onNewNote={handleNewNote}
        onDailyNote={handleDailyNote}
        onTakePhoto={() => void handleMediaAction("camera")}
        onPickImage={() => void handleMediaAction("photo")}
        onRecordAudio={() => void handleMediaAction("audio")}
      />
    </>
  );
}
