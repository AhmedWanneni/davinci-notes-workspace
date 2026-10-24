import React from "react";
import { View, Pressable } from "react-native";
import { Check, Sun, Moon, Palette } from "phosphor-react-native";
import { useTheme, BUILTIN_THEMES, type ThemeMode } from "../../theme";
import { Text } from "../primitives";

export function ThemeSettingsSection(): React.ReactElement {
  const { tokens, activeThemeId, themeMode, setTheme, setThemeMode } =
    useTheme();

  const modes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      id: "system",
      label: "System",
      icon: (
        <Palette
          size={16}
          color={
            themeMode === "system"
              ? tokens.color.interactive.accent
              : tokens.color.text.muted
          }
        />
      ),
    },
    {
      id: "light",
      label: "Light",
      icon: (
        <Sun
          size={16}
          color={
            themeMode === "light"
              ? tokens.color.interactive.accent
              : tokens.color.text.muted
          }
        />
      ),
    },
    {
      id: "dark",
      label: "Dark",
      icon: (
        <Moon
          size={16}
          color={
            themeMode === "dark"
              ? tokens.color.interactive.accent
              : tokens.color.text.muted
          }
        />
      ),
    },
  ];

  return (
    <View
      className="p-4 rounded-xl border mb-4"
      style={{
        backgroundColor: tokens.color.bg.secondary,
        borderColor: tokens.color.border.subtle,
      }}
    >
      <View className="flex-row items-center mb-3">
        <View className="mr-2">
          <Palette
            size={20}
            color={tokens.color.interactive.accent}
            weight="bold"
          />
        </View>
        <Text variant="h3" color="normal">
          Appearance & Themes
        </Text>
      </View>

      <Text variant="caption" color="muted" className="mb-3">
        Choose your interface color scheme and select an active theme.
      </Text>

      {/* Mode Selector */}
      <View
        className="flex-row rounded-lg p-1 border mb-4"
        style={{
          backgroundColor: tokens.color.bg.primary,
          borderColor: tokens.color.border.subtle,
        }}
      >
        {modes.map((m) => {
          const isSelected = themeMode === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => void setThemeMode(m.id)}
              accessibilityRole="button"
              accessibilityLabel={`Color mode ${m.label}`}
              className="flex-1 flex-row items-center justify-center py-2 rounded-md"
              style={{
                backgroundColor: isSelected
                  ? tokens.color.bg.hover
                  : "transparent",
              }}
            >
              <View className="mr-1.5">{m.icon}</View>
              <Text
                size="sm"
                weight={isSelected ? "semibold" : "regular"}
                color={isSelected ? "accent" : "muted"}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Theme List */}
      <Text variant="caption" color="muted" className="mb-2">
        Installed Built-in Themes
      </Text>

      <View
        className="rounded-lg border overflow-hidden"
        style={{
          borderColor: tokens.color.border.subtle,
          backgroundColor: tokens.color.bg.primary,
        }}
      >
        {Object.values(BUILTIN_THEMES).map((theme, index, arr) => {
          const isActive = activeThemeId === theme.id;
          const isLast = index === arr.length - 1;

          return (
            <Pressable
              key={theme.id}
              onPress={() => void setTheme(theme.id)}
              accessibilityRole="button"
              accessibilityLabel={`Select theme ${theme.name}`}
              className="flex-row items-center justify-between px-3 py-3"
              style={{
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: tokens.color.border.subtle,
                backgroundColor: isActive
                  ? tokens.color.bg.hover
                  : "transparent",
              }}
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View
                  className="w-4 h-4 rounded-full mr-2.5 border"
                  style={{
                    backgroundColor: theme.color.bg.primary,
                    borderColor: theme.color.border.normal,
                  }}
                />
                <View>
                  <Text
                    variant="body"
                    weight={isActive ? "semibold" : "regular"}
                    color="normal"
                  >
                    {theme.name}
                  </Text>
                  <Text variant="caption" color="muted">
                    {theme.isDark ? "Dark" : "Light"}
                  </Text>
                </View>
              </View>

              {isActive ? (
                <Check
                  size={18}
                  color={tokens.color.interactive.accent}
                  weight="bold"
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
