import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import EditorDom from "../components/EditorDom";
import { FormattingToolbar } from "../components/FormattingToolbar";
import {
  NOTE_200_LINES,
  NOTE_2000_LINES,
  NOTE_10000_LINES,
} from "../src/testNotes";
import type {
  DocChangeNotification,
  ToolbarActionType,
} from "../src/bridgeProtocol";

export default function EditorScreen(): React.ReactElement {
  const { preset } = useLocalSearchParams<{ preset?: string }>();

  let initialContent = NOTE_200_LINES;
  if (preset === "2000") initialContent = NOTE_2000_LINES;
  else if (preset === "10000") initialContent = NOTE_10000_LINES;
  else if (preset === "new") initialContent = "# New Untitled Note\n\n";

  const [actionTrigger, setActionTrigger] = useState<{
    id: number;
    action: ToolbarActionType;
  } | null>(null);

  const [lastNotification, setLastNotification] = useState<DocChangeNotification | null>(null);
  const [lastPayloadBytes, setLastPayloadBytes] = useState<number>(0);

  const handleDocChanged = (notification: DocChangeNotification, bytes: number) => {
    setLastNotification(notification);
    setLastPayloadBytes(bytes);
  };

  const handleToolbarAction = (action: ToolbarActionType) => {
    setActionTrigger({ id: Date.now(), action });
  };

  return (
    <View style={styles.container}>
      {/* Metrics Bar */}
      <View style={styles.metricsBar}>
        <Text style={styles.metricsText}>
          Bridge: {lastPayloadBytes} B | Length: {lastNotification?.docLength ?? initialContent.length}
        </Text>
      </View>

      {/* Editor DOM Host */}
      <View style={styles.editorHost}>
        <EditorDom
          initialContent={initialContent}
          onDocChanged={handleDocChanged}
          actionTrigger={actionTrigger}
          focusTrigger={preset === "new" ? 1 : 0}
        />
      </View>

      {/* Formatting Toolbar */}
      <FormattingToolbar onAction={handleToolbarAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  metricsBar: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e4",
  },
  metricsText: {
    fontSize: 11,
    color: "#5c5c5c",
  },
  editorHost: {
    flex: 1,
  },
});
