import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { CaretRight, HardDrive } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Text } from "./primitives";

export interface BreadcrumbsProps {
  currentFolder: string;
  onNavigate: (folder: string) => void;
}

export function Breadcrumbs({
  currentFolder,
  onNavigate,
}: BreadcrumbsProps): React.ReactElement {
  const segments = currentFolder
    ? currentFolder.split("/").filter(Boolean)
    : [];

  return (
    <View className="px-4 py-2 bg-bg-primary-alt border-b border-border-subtle flex-row items-center">
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
            color={darkColorTokens.text.accent}
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
                <CaretRight size={12} color={darkColorTokens.text.muted} />
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
