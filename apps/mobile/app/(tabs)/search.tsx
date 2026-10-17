import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { MagnifyingGlass, FileText, X } from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
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

  // Split by <mark> and </mark> tags
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MobileSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    } catch (err) {
      console.warn("[search] Query execution error:", err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    // 150ms debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      runSearch(query);
    }, 150);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, runSearch]);

  const handleApplyFilter = (filter: string) => {
    const updated = query ? `${query} ${filter}` : filter;
    setQuery(updated);
  };

  const handleOpenNote = (notePath: string) => {
    const targetId = defaultNoteStore.register(notePath);
    router.push({
      pathname: "/editor",
      params: { path: notePath, noteId: targetId, autoFocus: "1" },
    });
  };

  return (
    <ScreenLayout title="Search">
      <KeyboardAwareContainer scrollable={false}>
        {/* Search Input Area */}
        <View className="p-4 border-b border-border-subtle bg-bg-primary">
          <Input
            placeholder="Search full text, #tags, or operators..."
            value={query}
            onChangeText={setQuery}
            prefix={
              <MagnifyingGlass
                size={18}
                color={darkColorTokens.text.muted}
                weight="regular"
              />
            }
            suffix={
              query ? (
                <IconButton
                  icon={<X size={16} color={darkColorTokens.text.muted} />}
                  accessibilityLabel="Clear search"
                  size="sm"
                  variant="ghost"
                  onPress={() => setQuery("")}
                />
              ) : undefined
            }
          />

          {/* Tag & Path Quick Filters */}
          <View className="flex-row items-center gap-2 mt-3 flex-wrap">
            <Pressable onPress={() => handleApplyFilter("tag:todo")}>
              <Badge variant="accent">tag:todo</Badge>
            </Pressable>
            <Pressable onPress={() => handleApplyFilter("#mobile")}>
              <Badge variant="neutral">#mobile</Badge>
            </Pressable>
            <Pressable onPress={() => handleApplyFilter("#architecture")}>
              <Badge variant="neutral">#architecture</Badge>
            </Pressable>
            <Pressable onPress={() => handleApplyFilter("-tag:archive")}>
              <Badge variant="warning">-tag:archive</Badge>
            </Pressable>
          </View>
        </View>

        {/* Results Header */}
        <View className="px-4 py-2 bg-bg-primary-alt border-b border-border-subtle flex-row justify-between items-center">
          <Text variant="caption" color="muted">
            {isSearching ? "SEARCHING..." : `RESULTS (${results.length})`}
          </Text>
        </View>

        {/* Virtualized Results List */}
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
                  color={darkColorTokens.text.accent}
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
                  : "Type a query or select a tag filter above."}
              </Text>
            </View>
          }
        />
      </KeyboardAwareContainer>
    </ScreenLayout>
  );
}
