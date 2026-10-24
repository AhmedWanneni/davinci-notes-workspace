import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { CaretRight, HardDrive } from "phosphor-react-native";
import { useTheme } from "../theme";
import { Text } from "./primitives";

export interface BreadcrumbsProps {
  currentFolder: string;
  onNavigate: (folder: string) => void;
}

export function Breadcrumbs({
  currentFolder,
  onNavigate,
}: BreadcrumbsProps): React.ReactElement {
  const { tokens } = useTheme();
  const segments = currentFolder
    ? currentFolder.split("/").filter(Boolean)
    : [];

  return (
    <View
      className="px-4 py-2 border-b flex-row items-center"
      style={{
        backgroundColor: tokens.color.bg["primary-alt"],
        borderBottomColor: tokens.color.border.subtle,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: "row", alignItems: "center" }}
        contentContainerClassName="flex-row items-center"
      >
        {/* Root Vault item */}
        <Pressable
          onPress={() => onNavigate("")}
          className="flex-row items-center gap-1.5 py-1 px-1.5 rounded active:bg-bg-hover"
          accessibilityRole="button"
          accessibilityLabel="Navigate to vault root"
        >
          <HardDrive
            size={15}
            color={tokens.color.interactive.accent}
            weight="regular"
          />
          <Text
            variant="caption"
            weight={segments.length === 0 ? "bold" : "regular"}
            color={segments.length === 0 ? "accent" : "muted"}
          >
            Vault
          </Text>
        </Pressable>

        {/* Folder Segments */}
        {segments.map((seg, idx) => {
          const pathUpTo = segments.slice(0, idx + 1).join("/");
          const isLast = idx === segments.length - 1;

          return (
            <React.Fragment key={pathUpTo}>
              <View className="px-1 items-center justify-center">
                <CaretRight size={12} color={tokens.color.text.muted} />
              </View>
              <Pressable
                onPress={() => onNavigate(pathUpTo)}
                className="py-1 px-1.5 rounded active:bg-bg-hover"
                accessibilityRole="button"
                accessibilityLabel={`Navigate to ${seg}`}
              >
                <Text
                  variant="caption"
                  weight={isLast ? "bold" : "regular"}
                  color={isLast ? "normal" : "muted"}
                >
                  {seg}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}
