import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Tag as TagIcon, Hash } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Badge, ListItem, Text } from "../../components/primitives";
import { ScreenLayout } from "../../components/layout";
import { defaultVaultIndexer } from "../../indexer";
import { getCanonicalTag } from "@app/indexer";
import { getVaultIndexDb, withDbLock } from "../../database";

export interface DisplayTag {
  key: string;
  display: string;
  count: number;
  isNested: boolean;
  depth: number;
}

export default function TagsScreen(): React.ReactElement {
  const router = useRouter();
  const { tokens } = useTheme();
  const [tagList, setTagList] = useState<DisplayTag[]>([]);

  const loadTags = useCallback(async () => {
    // 1. Try in-memory TagIndex first
    const tagIndex = defaultVaultIndexer.getTagIndex();
    const memoryKeys = Array.from(tagIndex.tagToNotes.keys());

    if (memoryKeys.length > 0) {
      const items: DisplayTag[] = memoryKeys.map((key) => {
        const count = tagIndex.tagToNotes.get(key)?.size ?? 0;
        const display = getCanonicalTag(tagIndex, key)?.display ?? `#${key}`;
        const depth = key.split("/").length - 1;
        return {
          key,
          display: display.startsWith("#") ? display : `#${display}`,
          count,
          isNested: depth > 0,
          depth,
        };
      });

      items.sort((a, b) => a.key.localeCompare(b.key));
      setTagList(items);
      return;
    }

    // 2. Fallback to SQLite note_tags query serialized under withDbLock
    try {
      const db = await getVaultIndexDb();
      const rows = await withDbLock(() =>
        db.getAllAsync<{ tag_key: string; tag_display: string; count: number }>(
          `SELECT tag_key, tag_display, COUNT(path) as count
           FROM note_tags
           GROUP BY tag_key
           ORDER BY tag_key ASC;`,
        ),
      );

      const items: DisplayTag[] = rows.map((r) => {
        const depth = r.tag_key.split("/").length - 1;
        return {
          key: r.tag_key,
          display: r.tag_display.startsWith("#")
            ? r.tag_display
            : `#${r.tag_display}`,
          count: r.count,
          isNested: depth > 0,
          depth,
        };
      });

      setTagList(items);
    } catch {
      setTagList([]);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleTagPress = (tag: DisplayTag) => {
    // Navigate to Search tab with tag query
    router.push({
      pathname: "/(tabs)/search",
      params: { q: `tag:${tag.key}` },
    });
  };

  return (
    <ScreenLayout title="Tags">
      <View
        className="px-4 py-2 border-b flex-row justify-between items-center"
        style={{
          backgroundColor: tokens.color.bg["primary-alt"],
          borderBottomColor: tokens.color.border.subtle,
        }}
      >
        <Text variant="caption" color="muted">
          ALL VAULT TAGS ({tagList.length})
        </Text>
      </View>

      <FlatList
        data={tagList}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const indentClass =
            item.depth === 1 ? "pl-6" : item.depth >= 2 ? "pl-10" : "";

          return (
            <ListItem
              className={indentClass}
              title={
                <View className="flex-row items-center gap-1.5">
                  <Text
                    variant="body"
                    weight={item.depth === 0 ? "semibold" : "regular"}
                    color="normal"
                  >
                    {item.display}
                  </Text>
                  {item.isNested ? (
                    <Badge variant="neutral">nested</Badge>
                  ) : null}
                </View>
              }
              subtitle={`${item.count} ${item.count === 1 ? "note" : "notes"}`}
              left={
                item.isNested ? (
                  <Hash size={18} color={tokens.color.text.muted} />
                ) : (
                  <TagIcon
                    size={20}
                    color={tokens.color.interactive.accent}
                    weight="regular"
                  />
                )
              }
              right={<Badge variant="accent">{item.count}</Badge>}
              onPress={() => handleTagPress(item)}
            />
          );
        }}
        ListEmptyComponent={
          <View className="p-8 items-center justify-center">
            <Text variant="body" color="muted">
              No tags indexed in this vault yet. Add #tags to notes to organize
              them.
            </Text>
          </View>
        }
      />
    </ScreenLayout>
  );
}
