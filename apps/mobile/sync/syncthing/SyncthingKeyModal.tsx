import React, { useState } from "react";
import { View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Sheet, Button, Input, Text } from "../../components/primitives";

export interface SyncthingKeyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => Promise<void>;
  onClear: () => Promise<void>;
  hasSavedKey: boolean;
}

export const SyncthingKeyModal: React.FC<SyncthingKeyModalProps> = ({
  visible,
  onClose,
  onSave,
  onClear,
  hasSavedKey,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setApiKey(text.trim());
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setIsBusy(true);
    try {
      await onSave(apiKey.trim());
      setApiKey("");
      onClose();
    } finally {
      setIsBusy(false);
    }
  };

  const handleClear = async () => {
    setIsBusy(true);
    try {
      await onClear();
      setApiKey("");
      onClose();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Syncthing API Key"
      className="p-4"
    >
      <Text size="sm" color="muted" className="mb-3">
        Copy your Syncthing Web GUI API key and paste it below. Stored securely
        in device keychain.
      </Text>

      <View className="mb-4">
        <Input
          placeholder="Paste Syncthing API key..."
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          className="font-mono text-xs"
        />
      </View>

      <View className="flex-row gap-2 mb-3">
        <Button
          variant="secondary"
          size="sm"
          onPress={handlePaste}
          className="flex-1"
        >
          Paste
        </Button>
        <Button
          variant="primary"
          size="sm"
          onPress={handleSave}
          disabled={!apiKey.trim() || isBusy}
          className="flex-1"
        >
          {isBusy ? "Saving..." : "Save Key"}
        </Button>
      </View>

      {hasSavedKey ? (
        <Button
          variant="danger"
          size="sm"
          onPress={handleClear}
          disabled={isBusy}
          className="mt-1"
        >
          Remove Saved Key
        </Button>
      ) : null}
    </Sheet>
  );
};

SyncthingKeyModal.displayName = "SyncthingKeyModal";
