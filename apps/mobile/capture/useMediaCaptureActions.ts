import { useState, useRef } from "react";
import { Alert } from "react-native";
import type { ToolbarActionType } from "../src/bridgeProtocol";
import { defaultVaultManager } from "../vault";
import {
  capturePhotoFromCamera,
  pickPhotoFromLibrary,
  startVoiceMemoRecording,
  type ActiveRecordingHandle,
} from "./mediaCaptureService";
import { captureItem } from "./fastCaptureService";

export function useMediaCaptureActions(
  onInsertText: (markdown: string) => void,
) {
  const [isRecording, setIsRecording] = useState(false);
  const recordingHandleRef = useRef<ActiveRecordingHandle | null>(null);

  const handleMediaAction = async (action: ToolbarActionType) => {
    const { adapter } = await defaultVaultManager.getActiveAdapter();
    if (!adapter) return;

    if (action === "camera") {
      const res = await capturePhotoFromCamera();
      if (!res.success) {
        if (res.reason === "permission-denied") {
          Alert.alert(
            "Camera Access Needed",
            "Camera permission was denied. Please allow camera access in device Settings to take photos for your notes.",
          );
        }
        return;
      }
      const captured = await captureItem(
        adapter,
        { type: "image", fileUri: res.uri, filename: res.filename },
        "quick-notes",
      );
      if (captured.attachmentPath) {
        const filename =
          captured.attachmentPath.split("/").pop() ?? res.filename;
        onInsertText(`\n![[Attachments/${filename}]]\n`);
      }
    } else if (action === "photo") {
      const res = await pickPhotoFromLibrary();
      if (!res.success) {
        if (res.reason === "permission-denied") {
          Alert.alert(
            "Photos Access Needed",
            "Photos permission was denied. Please allow photos access in device Settings to attach photos.",
          );
        }
        return;
      }
      const captured = await captureItem(
        adapter,
        { type: "image", fileUri: res.uri, filename: res.filename },
        "quick-notes",
      );
      if (captured.attachmentPath) {
        const filename =
          captured.attachmentPath.split("/").pop() ?? res.filename;
        onInsertText(`\n![[Attachments/${filename}]]\n`);
      }
    } else if (action === "audio") {
      if (isRecording && recordingHandleRef.current) {
        setIsRecording(false);
        const res = await recordingHandleRef.current.stop();
        recordingHandleRef.current = null;
        if (res.success && res.uri) {
          const captured = await captureItem(
            adapter,
            { type: "audio", fileUri: res.uri, filename: res.filename },
            "quick-notes",
          );
          if (captured.attachmentPath) {
            const filename =
              captured.attachmentPath.split("/").pop() ?? res.filename;
            onInsertText(`\n![[Attachments/${filename}]]\n`);
          }
        }
      } else {
        const res = await startVoiceMemoRecording();
        if ("handle" in res) {
          recordingHandleRef.current = res.handle;
          setIsRecording(true);
        } else if (res.reason === "permission-denied") {
          Alert.alert(
            "Microphone Access Needed",
            "Microphone permission was denied. Please allow microphone access in device Settings to record voice memos.",
          );
        }
      }
    }
  };

  return { handleMediaAction, isRecording };
}
