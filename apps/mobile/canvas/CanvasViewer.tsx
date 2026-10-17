import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Text } from "../components/primitives/Text";
import { Badge } from "../components/primitives/Badge";
import type { MobileVaultStorageAdapter } from "../vault";
import { darkColorTokens } from "@app/design-tokens/mobile";
import {
  parseCanvasWithCycleDetection,
  type CanvasDocument,
} from "./canvasParser";
import CanvasViewerDom from "./CanvasViewerDom";

export interface CanvasViewerProps {
  canvasPath: string;
  adapter: MobileVaultStorageAdapter;
  onNavigate?: (path: string) => void;
}

export const CanvasViewer: React.FC<CanvasViewerProps> = ({
  canvasPath,
  adapter,
}) => {
  const [document, setDocument] = useState<CanvasDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    const fileReader = async (path: string): Promise<string> => {
      const file = await adapter.readNote(path);
      return file.content;
    };

    adapter
      .readNote(canvasPath)
      .then((file) =>
        parseCanvasWithCycleDetection(file.content, canvasPath, fileReader),
      )
      .then((doc) => {
        if (!isCancelled) {
          setDocument(doc);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(String(err));
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [canvasPath, adapter]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary">
        <ActivityIndicator
          size="small"
          color={darkColorTokens.interactive.accent}
        />
        <Text variant="caption" color="muted" className="mt-2">
          Loading canvas...
        </Text>
      </View>
    );
  }

  if (error || !document) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary p-4">
        <Text variant="body" color="error">
          Failed to load canvas: {error ?? "Invalid canvas format"}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-primary">
      {document.hasCycle && (
        <View className="p-2 bg-accent-warning/10 border-b border-accent-warning flex-row items-center justify-between">
          <Text variant="caption" color="warning">
            Circular canvas embed detected and neutralized
          </Text>
          <Badge variant="warning">Cycle Protected</Badge>
        </View>
      )}
      <View className="flex-1">
        <CanvasViewerDom document={document} />
      </View>
    </View>
  );
};
