import React, { useMemo } from "react";
import { View } from "react-native";
import { parseMarkdownDocument } from "../reader/markdownParser";
import { NoteReaderView } from "../reader/NoteReaderView";
import { Text } from "./primitives";

export interface EditorPreviewViewProps {
  content: string;
  title: string;
  onEditPress: () => void;
  onWikilinkPress?: (target: string) => void;
  onTagPress?: (tag: string) => void;
}

export function EditorPreviewView({
  content,
  title,
  onEditPress,
  onWikilinkPress,
  onTagPress,
}: EditorPreviewViewProps): React.ReactElement {
  const document = useMemo(() => {
    return parseMarkdownDocument(content);
  }, [content]);

  if (!content.trim()) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text variant="body" color="muted">
          Nothing to preview yet. Switch to Edit to write something.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <NoteReaderView
        document={document}
        title={title}
        onWikilinkPress={onWikilinkPress ?? (() => {})}
        onTagPress={onTagPress ?? (() => {})}
        onEditPress={onEditPress}
      />
    </View>
  );
}
