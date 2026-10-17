export type MediaCaptureErrorReason =
  "permission-denied" | "cancelled" | "unavailable" | "io-error";

export interface MediaCaptureResult {
  success: boolean;
  uri?: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  durationMs?: number;
  reason?: MediaCaptureErrorReason;
  errorMessage?: string;
  canAskAgain?: boolean;
}

/**
 * Lazy-loads expo-image-picker and captures a photo via device camera.
 * Never imports native camera modules at app launch.
 */
export async function capturePhotoFromCamera(): Promise<MediaCaptureResult> {
  try {
    const ImagePicker = await import("expo-image-picker");
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      return {
        success: false,
        reason: "permission-denied",
        canAskAgain: perm.canAskAgain,
        errorMessage: "Camera permission denied. Enable in Settings.",
      };
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, reason: "cancelled" };
    }

    const asset = result.assets[0];
    return {
      success: true,
      uri: asset.uri,
      filename: asset.fileName || `camera-${Date.now()}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
      sizeBytes: asset.fileSize,
    };
  } catch (error) {
    return {
      success: false,
      reason: "io-error",
      errorMessage: error instanceof Error ? error.message : "Camera error",
    };
  }
}

/**
 * Lazy-loads expo-image-picker and picks a photo from the media library.
 */
export async function pickPhotoFromLibrary(): Promise<MediaCaptureResult> {
  try {
    const ImagePicker = await import("expo-image-picker");
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return {
        success: false,
        reason: "permission-denied",
        canAskAgain: perm.canAskAgain,
        errorMessage: "Photos permission denied. Enable in Settings.",
      };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, reason: "cancelled" };
    }

    const asset = result.assets[0];
    return {
      success: true,
      uri: asset.uri,
      filename: asset.fileName || `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
      sizeBytes: asset.fileSize,
    };
  } catch (error) {
    return {
      success: false,
      reason: "io-error",
      errorMessage: error instanceof Error ? error.message : "Library error",
    };
  }
}

export interface ActiveRecordingHandle {
  stop: () => Promise<MediaCaptureResult>;
}

/**
 * Lazy-loads expo-audio and starts recording a voice memo.
 */
export async function startVoiceMemoRecording(): Promise<
  { success: true; handle: ActiveRecordingHandle } | MediaCaptureResult
> {
  try {
    const {
      requestRecordingPermissionsAsync,
      setAudioModeAsync,
      RecordingPresets,
      AudioRecorder,
    } = await import("expo-audio");
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      return {
        success: false,
        reason: "permission-denied",
        canAskAgain: perm.canAskAgain,
        errorMessage: "Microphone permission denied. Enable in Settings.",
      };
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    const recording = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
    await recording.prepareToRecordAsync();
    recording.record();

    const startedAt = Date.now();
    const handle: ActiveRecordingHandle = {
      stop: async () => {
        try {
          await recording.stop();
          const uri = recording.uri;
          const durationMs = Date.now() - startedAt;
          return {
            success: true,
            uri: uri ?? undefined,
            filename: `recording-${Date.now()}.m4a`,
            mimeType: "audio/m4a",
            durationMs,
          };
        } catch (err) {
          return {
            success: false,
            reason: "io-error",
            errorMessage:
              err instanceof Error ? err.message : "Stop audio error",
          };
        }
      },
    };

    return { success: true, handle };
  } catch (error) {
    return {
      success: false,
      reason: "io-error",
      errorMessage: error instanceof Error ? error.message : "Recording error",
    };
  }
}
