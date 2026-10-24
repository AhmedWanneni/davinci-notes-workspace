import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, FlatList, Pressable, BackHandler } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MagnifyingGlass, FileText, X } from "phosphor-react-native";
import { useTheme } from "../../theme";
import {
  Badge,
  IconButton,
  Input,
  ListItem,
  Text,
} from "../../components/primitives";
import { ScreenLayout, KeyboardAwareContainer } from "../../components/layout";
import {
  defaultVaultIndexer,
  searchVault,
  type MobileSearchResult,
} from "../../indexer";
import { defaultNoteStore } from "../../vault/noteStore";

function HighlightedSnippet({
  snippet,
}: {
  snippet?: string;
}): React.ReactElement {
  if (!snippet) {
    return (
      <Text variant="caption" color="muted">
        No snippet available
      </Text>
    );
  }

  const parts = snippet.split(/(<mark>.*?<\/mark>)/g);

  return (
    <Text variant="caption" color="muted" numberOfLines={2}>
      {parts.map((part, index) => {
        if (part.startsWith("<mark>") && part.endsWith("</mark>")) {
          const matchText = part.slice(6, -7);
          return (
            <Text
              key={index}
              variant="caption"
              weight="semibold"
              color="accent"
            >
              {matchText}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

export default function SearchScreen(): React.ReactElement {
  const router = useRouter();
  const { tokens } = useTheme();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? "");
  const [results, setResults] = useState<MobileSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (q) setQuery(q);
  }, [q]);

  useEffect(() => {
    try {
      const tagIndex = defaultVaultIndexer.getTagIndex();
      const tags = Array.from(tagIndex.tagToNotes.keys()).slice(0, 5);
      setPopularTags(tags);
    } catch {
      setPopularTags([]);
    }
  }, []);

  const runSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const tagIndex = defaultVaultIndexer.getTagIndex();
      const hits = await searchVault(text, tagIndex);
      setResults(hits);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

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
      return false;
    });
    return () => sub.remove();
  }, [query]);

  const handleApplyFilter = (filter: string) => {
    setQuery(query ? `${query} ${filter}` : filter);
  };

  const handleOpenNote = (notePath: string) => {
    const targetId = defaultNoteStore.register(notePath);
    router.push({
      pathname: "/editor",
      params: { path: notePath, noteId: targetId, mode: "preview" },
    });
  };

  return (
    <ScreenLayout title="Search">
      <KeyboardAwareContainer scrollable={false}>
        <View
          className="p-4 border-b"
          style={{
            backgroundColor: tokens.color.bg.primary,
            borderBottomColor: tokens.color.border.subtle,
          }}
        >
          <Input
            placeholder="Search full text, #tags, or operators..."
            value={query}
            onChangeText={setQuery}
            prefix={
              <MagnifyingGlass
                size={18}
                color={tokens.color.text.muted}
                weight="regular"
              />
            }
            suffix={
              query ? (
                <IconButton
                  icon={<X size={16} color={tokens.color.text.muted} />}
                  accessibilityLabel="Clear search"
                  size="sm"
                  variant="ghost"
                  onPress={() => setQuery("")}
                />
              ) : undefined
            }
          />

          {popularTags.length > 0 ? (
            <View className="flex-row items-center gap-2 mt-3 flex-wrap">
              {popularTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => handleApplyFilter(`#${tag}`)}
                >
                  <Badge variant="accent">#{tag}</Badge>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View
          className="px-4 py-2 border-b flex-row justify-between items-center"
          style={{
            backgroundColor: tokens.color.bg["primary-alt"],
            borderBottomColor: tokens.color.border.subtle,
          }}
        >
          <Text variant="caption" color="muted">
            {isSearching ? "SEARCHING..." : `RESULTS (${results.length})`}
          </Text>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.path}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ListItem
              title={item.title || item.path}
              subtitle={<HighlightedSnippet snippet={item.snippet} />}
              left={
                <FileText
                  size={20}
                  color={tokens.color.interactive.accent}
                  weight="regular"
                />
              }
              right={
                item.score ? <Badge variant="neutral">match</Badge> : undefined
              }
              onPress={() => handleOpenNote(item.path)}
            />
          )}
          ListEmptyComponent={
            <View className="p-8 items-center justify-center">
              <Text variant="body" color="muted">
                {query.trim()
                  ? isSearching
                    ? "Searching SQLite FTS5 index..."
                    : "No matching notes found."
                  : "Type a query or select a tag above."}
              </Text>
            </View>
          }
        />
      </KeyboardAwareContainer>
    </ScreenLayout>
  );
}
