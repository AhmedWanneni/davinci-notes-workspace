import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, FlatList, Pressable, BackHandler } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MagnifyingGlass, X, CaretLeft } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { Text, Input } from "../components/primitives";
import { EditorBottomBar } from "../components/EditorBottomBar";
import { defaultVaultIndexer, searchVault } from "../indexer";
import { defaultNoteStore } from "../vault/noteStore";
import { defaultVaultManager } from "../vault/vaultManager";

interface SearchCardItem {
  id: string;
  title: string;
  snippet: string;
  path: string;
  type: "Note" | "Task";
}

export default function SearchScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? "");
  const [items, setItems] = useState<SearchCardItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<SearchCardItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadAllItems = useCallback(async () => {
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return [];
      const scan = await adapter.scanVault();
      const list: SearchCardItem[] = [];

      for (const notePath of scan.notes) {
        try {
          const file = await adapter.readNote(notePath);
          const title =
            notePath.replace(/\.md$/i, "").split("/").pop() ?? notePath;
          const isTask =
            /todos[/$\\]/i.test(notePath) ||
            file.content.includes("- [ ]") ||
            file.content.includes("- [x]");
          const lines = file.content
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith("#"));
          let snippet = lines[0] ?? "";
          snippet = snippet
            .replace(/^-\s*\[[ x]\]\s*/i, "")
            .replace(/\(@[^)]+\)/g, "")
            .replace(/\[\d+\s*min\]/g, "")
            .trim();
          if (!snippet) snippet = isTask ? "Checklist tasks" : "Note drafts";

          list.push({
            id: notePath,
            title,
            snippet,
            path: notePath,
            type: isTask ? "Task" : "Note",
          });
        } catch {
          // Skip unreadable note
        }
      }
      return list;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    void loadAllItems().then((all) => {
      setItems(all);
      if (!query.trim()) setDisplayedItems(all);
    });
  }, [loadAllItems]);

  const runSearch = useCallback(
    async (text: string) => {
      const trimmed = text.trim().toLowerCase();
      if (!trimmed) {
        setDisplayedItems(items);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const localMatches = items.filter(
          (it) =>
            it.title.toLowerCase().includes(trimmed) ||
            it.snippet.toLowerCase().includes(trimmed),
        );
        const tagIndex = defaultVaultIndexer.getTagIndex();
        const ftsHits = await searchVault(text, tagIndex);
        const existingPaths = new Set(localMatches.map((m) => m.path));
        const combined = [...localMatches];

        for (const hit of ftsHits) {
          if (!existingPaths.has(hit.path)) {
            existingPaths.add(hit.path);
            const isTask = /todos[/$\\]/i.test(hit.path);
            combined.push({
              id: hit.path,
              title:
                hit.title ||
                hit.path.replace(/\.md$/i, "").split("/").pop() ||
                "Untitled",
              snippet: (hit.snippet || "").replace(/<\/?mark>/g, ""),
              path: hit.path,
              type: isTask ? "Task" : "Note",
            });
          }
        }
        setDisplayedItems(combined);
      } catch {
        setDisplayedItems(
          items.filter((it) => it.title.toLowerCase().includes(trimmed)),
        );
      } finally {
        setIsSearching(false);
      }
    },
    [items],
  );

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void runSearch(query);
    }, 150);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (query.trim()) {
        setQuery("");
        return true;
      }
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [query, router]);

  const handleOpenNote = (notePath: string) => {
    const targetId = defaultNoteStore.register(notePath);
    router.push({
      pathname: "/editor",
      params: { path: notePath, noteId: targetId, mode: "edit" },
    });
  };

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: tokens.color.bg.primary,
        paddingTop: insets.top + 8,
      }}
    >
      {/* Top Search Bar Row */}
      <View className="flex-row items-center px-4 pb-3" style={{ gap: 8 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="p-1.5 -ml-1 active:opacity-60"
        >
          <CaretLeft
            size={22}
            color={tokens.color.text.normal}
            weight="regular"
          />
        </Pressable>

        <View className="flex-1">
          <Input
            placeholder="Search notes & tasks..."
            value={query}
            onChangeText={setQuery}
            prefix={
              <MagnifyingGlass size={20} color={tokens.color.text.muted} />
            }
            suffix={
              query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery("")}
                  className="p-1 active:opacity-60"
                >
                  <X size={18} color={tokens.color.text.muted} />
                </Pressable>
              ) : null
            }
            autoFocus={!q}
          />
        </View>
      </View>

      {/* Results Cards List */}
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleOpenNote(item.path)}
            className="p-4 rounded-2xl mb-3 flex-row items-center justify-between active:opacity-75"
            style={{
              backgroundColor: tokens.color.bg.secondary,
            }}
          >
            <View className="flex-1 mr-3">
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: tokens.color.text.normal,
                  marginBottom: 4,
                }}
              >
                {item.title}
              </Text>
              <Text
                numberOfLines={1}
                style={{ fontSize: 14, color: tokens.color.text.muted }}
              >
                {item.snippet}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: tokens.color.text.muted,
              }}
            >
              {item.type}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="p-8 items-center justify-center">
            <Text
              style={{
                fontSize: 14,
                color: tokens.color.text.muted,
                textAlign: "center",
              }}
            >
              {isSearching
                ? "Searching..."
                : query.trim()
                  ? "No matching notes or tasks found."
                  : "No notes or tasks found."}
            </Text>
          </View>
        }
      />

      {/* Editor Navigation Bar */}
      <EditorBottomBar
        onTodo={() => router.push("/todos")}
        onNewNote={() =>
          router.push({
            pathname: "/editor",
            params: { preset: "new", autoFocus: "1" },
          })
        }
        onSearch={() => {}}
        onNotifications={() =>
          router.push({ pathname: "/todos", params: { tab: "reminders" } })
        }
        onTabs={() => router.push("/editor")}
        onMenu={() => router.push("/settings")}
        tabCount={1}
      />
    </View>
  );
}
