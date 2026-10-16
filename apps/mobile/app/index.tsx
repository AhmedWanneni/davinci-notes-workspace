import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { emptyNoteTagSet, type Note } from "@app/core-types";
import { parseLinks } from "@app/indexer";

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();

  // Demonstrate shared package usage in mobile shell
  const demoNote: Note = {
    path: "welcome.md",
    title: "Welcome to DaVinci Mobile",
    content: "Welcome to DaVinci Notes! Links: [[Project Roadmap]] and #mobile.",
    mtime: Date.now(),
    frontmatter: {},
    tags: emptyNoteTagSet(),
    outlinks: parseLinks(
      "Welcome to DaVinci Notes! Links: [[Project Roadmap]] and #mobile.",
      { sourcePath: "welcome.md", notePaths: ["Project Roadmap.md"] },
    ),
  };

  const handleOpenPreset = (lines: "200" | "2000" | "10000" | "new") => {
    router.push({
      pathname: "/editor",
      params: { preset: lines },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>{demoNote.title}</Text>
      <Text style={styles.subtitle}>
        Local-first note taking powered by CodeMirror 6 and Expo.
      </Text>

      <View style={styles.badgeContainer}>
        <Text style={styles.badge}>Outlinks: {demoNote.outlinks.length}</Text>
        <Text style={styles.badge}>Tags: #mobile</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Test Documents</Text>
        <Text style={styles.cardDescription}>
          Select a test document to benchmark live preview rendering and virtual keyboard avoidance:
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => handleOpenPreset("200")}
        >
          <Text style={styles.buttonText}>Open 200-Line Note</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => handleOpenPreset("2000")}
        >
          <Text style={styles.buttonText}>Open 2,000-Line Note</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => handleOpenPreset("10000")}
        >
          <Text style={styles.buttonText}>Open 10,000-Line Note</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.newNoteButton]}
          onPress={() => handleOpenPreset("new")}
        >
          <Text style={[styles.buttonText, styles.newNoteText]}>+ Create New Note</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#5c5c5c",
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: "rgba(127, 109, 242, 0.12)",
    color: "#7f6df2",
    fontSize: 12,
    fontWeight: "500",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  card: {
    backgroundColor: "#f6f6f6",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e4e4e4",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: "#5c5c5c",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222222",
  },
  newNoteButton: {
    backgroundColor: "#222222",
    borderColor: "#222222",
  },
  newNoteText: {
    color: "#ffffff",
  },
});
