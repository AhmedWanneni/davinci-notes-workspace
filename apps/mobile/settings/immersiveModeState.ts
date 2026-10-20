import { useEffect, useSyncExternalStore } from "react";
import { AppState, Keyboard, Platform } from "react-native";
import { NavigationBar, setVisibilityAsync } from "expo-navigation-bar";
import { getVaultIndexDb, withDbLock } from "../database";

const SETTINGS_KEY = "ui.immersive_mode";
let cachedImmersiveMode = false;
let isLoaded = false;

const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeImmersiveMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getImmersiveModeSnapshot(): boolean {
  return cachedImmersiveMode;
}

export async function loadImmersiveModeFromDb(): Promise<boolean> {
  try {
    const db = await getVaultIndexDb();
    const rows = await withDbLock(() =>
      db.getAllAsync<{ key: string; value: string }>(
        "SELECT value FROM settings WHERE key = ?",
        [SETTINGS_KEY],
      ),
    );
    if (rows.length > 0 && rows[0]?.value !== undefined) {
      cachedImmersiveMode = rows[0].value === "1";
    } else {
      cachedImmersiveMode = false;
    }
    isLoaded = true;
    notifyListeners();
    return cachedImmersiveMode;
  } catch (err) {
    console.warn("[immersiveMode] Failed to load setting from DB:", err);
    return cachedImmersiveMode;
  }
}

export async function saveImmersiveModeToDb(enabled: boolean): Promise<void> {
  cachedImmersiveMode = enabled;
  isLoaded = true;
  notifyListeners();

  try {
    const db = await getVaultIndexDb();
    await withDbLock(async () => {
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [SETTINGS_KEY, enabled ? "1" : "0"],
      );
    });
  } catch (err) {
    console.warn("[immersiveMode] Failed to save setting to DB:", err);
  }
}

export function useImmersiveMode(): {
  isImmersiveMode: boolean;
  setImmersiveMode: (enabled: boolean) => Promise<void>;
} {
  if (!isLoaded) {
    void loadImmersiveModeFromDb();
  }

  const isImmersiveMode = useSyncExternalStore(
    subscribeImmersiveMode,
    getImmersiveModeSnapshot,
    getImmersiveModeSnapshot,
  );

  return {
    isImmersiveMode,
    setImmersiveMode: saveImmersiveModeToDb,
  };
}

function applyNavigationBarVisibility(hidden: boolean): void {
  if (Platform.OS !== "android") return;
  try {
    if (typeof NavigationBar.setHidden === "function") {
      NavigationBar.setHidden(hidden);
    } else if (typeof setVisibilityAsync === "function") {
      void setVisibilityAsync(hidden ? "hidden" : "visible");
    }
  } catch {
    // Graceful no-op on unsupported environments
  }
}

export function useImmersiveNavigationBar(): void {
  const { isImmersiveMode } = useImmersiveMode();

  useEffect(() => {
    if (Platform.OS !== "android" || !isImmersiveMode) return;

    // 1. Hide on screen mount
    applyNavigationBarVisibility(true);

    // 2. Re-assert when keyboard closes
    const keyboardSub = Keyboard.addListener("keyboardDidHide", () => {
      applyNavigationBarVisibility(true);
    });

    // 3. Re-assert when app returns from background
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        applyNavigationBarVisibility(true);
      }
    });

    return () => {
      keyboardSub.remove();
      appStateSub.remove();
      // Restore navigation bar on unmount
      applyNavigationBarVisibility(false);
    };
  }, [isImmersiveMode]);
}
