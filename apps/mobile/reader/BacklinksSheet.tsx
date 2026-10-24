import React, { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Link, Eye } from "phosphor-react-native";
import { useTheme } from "../theme";
import { Badge, Sheet, Text } from "../components/primitives";
import type { MentionItem } from "./backlinksQuery";

export interface BacklinksSheetProps {
  visible: boolean;
  onClose: () => void;
  linked: MentionItem[];
  unlinked: MentionItem[];
  loading?: boolean;
  onSelectNote: (path: string) => void;
}

export function BacklinksSheet({
  visible,
  onClose,
  linked,
  unlinked,
  loading = false,
  onSelectNote,
}: BacklinksSheetProps): React.ReactElement {
  const { tokens } = useTheme();
  const [tab, setTab] = useState<"linked" | "unlinked">("linked");

  const activeItems = tab === "linked" ? linked : unlinked;

  return (
    <Sheet visible={visible} onClose={onClose} title="Mentions & Backlinks">
      {/* Tabs */}
      <View
        className="flex-row border-b mb-3"
        style={{ borderBottomColor: tokens.color.border.subtle }}
      >
        <Pressable
          onPress={() => setTab("linked")}
          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 min-h-[44px] border-b-2"
          style={{
            borderBottomColor:
              tab === "linked"
                ? tokens.color.interactive.accent
                : "transparent",
            backgroundColor:
              tab === "linked" ? tokens.color.bg.hover : "transparent",
          }}
          accessibilityRole="tab"
          accessibilityLabel="Linked mentions tab"
        >
          <Link
            size={16}
            color={
              tab === "linked"
                ? tokens.color.interactive.accent
                : tokens.color.text.muted
            }
          />
          <Text
            variant="caption"
            weight="medium"
            color={tab === "linked" ? "accent" : "muted"}
          >
            Linked ({linked.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab("unlinked")}
          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 min-h-[44px] border-b-2"
          style={{
            borderBottomColor:
              tab === "unlinked"
                ? tokens.color.interactive.accent
                : "transparent",
            backgroundColor:
              tab === "unlinked" ? tokens.color.bg.hover : "transparent",
          }}
          accessibilityRole="tab"
          accessibilityLabel="Unlinked mentions tab"
        >
          <Eye
            size={16}
            color={
              tab === "unlinked"
                ? tokens.color.interactive.accent
                : tokens.color.text.muted
            }
          />
          <Text
            variant="caption"
            weight="medium"
            color={tab === "unlinked" ? "accent" : "muted"}
          >
            Unlinked ({unlinked.length})
          </Text>
        </Pressable>
      </View>

      {/* List */}
      <ScrollView className="max-h-[55vh]" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="py-8 items-center">
            <Text variant="body" color="muted">
              Scanning mentions...
            </Text>
          </View>
        ) : activeItems.length === 0 ? (
          <View className="py-8 items-center">
            <Text variant="body" color="muted">
              {tab === "linked"
                ? "No linked backlinks."
                : "No unlinked mentions."}
            </Text>
          </View>
        ) : (
          activeItems.map((item) => (
            <Pressable
              key={item.sourcePath}
              onPress={() => {
                onSelectNote(item.sourcePath);
                onClose();
              }}
              className="p-3 mb-2 min-h-[44px] rounded-md border active:bg-bg-hover"
              style={{
                backgroundColor: tokens.color.bg["primary-alt"],
                borderColor: tokens.color.border.subtle,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Navigate to note ${item.sourceTitle}`}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text variant="body" weight="semibold" color="normal">
                  {item.sourceTitle}
                </Text>
                <Badge variant={item.isLinked ? "accent" : "neutral"}>
                  {item.isLinked ? "Linked" : "Unlinked"}
                </Badge>
              </View>
              <Text variant="caption" color="muted" numberOfLines={2}>
                {item.snippet}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Sheet>
  );
}
