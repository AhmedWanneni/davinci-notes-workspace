import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import type { AudioLevelPayload } from "../../adapters/transcriptionClient";

export interface AudioLevels {
  micLevel: number;
  systemLevel: number;
}

export function useAudioLevels(): AudioLevels {
  const [micLevel, setMicLevel] = useState(0);
  const [systemLevel, setSystemLevel] = useState(0);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    try {
      listen<AudioLevelPayload>("davinci-audio-levels", (event) => {
        if (event.payload) {
          setMicLevel(event.payload.mic_rms);
          setSystemLevel(event.payload.system_rms);
        }
      })
        .then((fn) => {
          unlisten = fn;
        })
        .catch(() => {
          // Mock or outside Tauri
        });
    } catch {
      // Ignored
    }
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return { micLevel, systemLevel };
}
