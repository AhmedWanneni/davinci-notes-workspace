import { getSetting, getVaultIndexDb, withDbLock } from "../vault";

export interface AIStartupGate {
  cloudEnabled: boolean;
  providerId: string;
  providerReady: boolean;
}

/** Reads only persisted flags before the AI subsystem itself is eligible to load. */
export async function loadAIStartupGate(): Promise<AIStartupGate> {
  const db = await getVaultIndexDb();
  return withDbLock(async () => {
    const providerId = await getSetting(db, "ai.provider.id") ?? "openai-compatible";
    const statusKey = providerId === "openai-compatible" ? "ai.provider.status" : `ai.provider.status.${providerId}`;
    // tauri-plugin-sql uses one native connection: queueing the outer callback
    // is insufficient if its individual statements are still issued in parallel.
    const cloud = await getSetting(db, "ai.consent.cloud");
    const status = await getSetting(db, statusKey);
    return { cloudEnabled: cloud === "enabled", providerId, providerReady: status === "ready" };
  });
}
