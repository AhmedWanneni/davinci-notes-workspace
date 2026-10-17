import React, { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Link, Eye } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
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
  const [tab, setTab] = useState<"linked" | "unlinked">("linked");

  const activeItems = tab === "linked" ? linked : unlinked;

  return (
    <Sheet visible={visible} onClose={onClose} title="Mentions & Backlinks">
      {/* Tabs */}
      <View className="flex-row border-b border-border-subtle mb-3">
        <Pressable
          onPress={() => setTab("linked")}
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 min-h-[44px] border-b-2 ${
            tab === "linked"
              ? "border-accent bg-bg-hover/30"
              : "border-transparent"
          }`}
          accessibilityRole="tab"
          accessibilityLabel="Linked mentions tab"
        >
          <Link
            size={16}
            color={
              tab === "linked"
                ? darkColorTokens.text.accent
                : darkColorTokens.text.muted
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
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 min-h-[44px] border-b-2 ${
            tab === "unlinked"
              ? "border-accent bg-bg-hover/30"
              : "border-transparent"
          }`}
          accessibilityRole="tab"
          accessibilityLabel="Unlinked mentions tab"
        >
          <Eye
            size={16}
            color={
              tab === "unlinked"
                ? darkColorTokens.text.accent
                : darkColorTokens.text.muted
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
              className="p-3 mb-2 min-h-[44px] rounded-md border border-border-subtle bg-bg-primary-alt active:bg-bg-hover"
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
