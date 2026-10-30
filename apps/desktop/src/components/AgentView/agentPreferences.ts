import {
  getSetting,
  getVaultIndexDb,
  setSetting,
  withDbLock,
} from "../../vault";

export interface AgentPreferences {
  autoApply: boolean;
  webSearchEnabled: boolean;
  rewriteEnabled: boolean;
}

const SETTING_AUTO_APPLY = "ai.agent.autoApply";
const SETTING_WEB_SEARCH = "ai.agent.webSearchEnabled";
const SETTING_REWRITE = "ai.agent.rewriteEnabled";

export async function loadAgentPreferences(): Promise<AgentPreferences> {
  try {
    const db = await getVaultIndexDb();
    const { autoApply, webSearch, rewrite } = await withDbLock(async () => ({
      autoApply: await getSetting(db, SETTING_AUTO_APPLY),
      webSearch: await getSetting(db, SETTING_WEB_SEARCH),
      rewrite: await getSetting(db, SETTING_REWRITE),
    }));
    return {
      autoApply: autoApply !== "false", // default to true
      webSearchEnabled: webSearch !== "false", // default to true
      rewriteEnabled: rewrite !== "false", // default to true
    };
  } catch {
    return {
      autoApply: true,
      webSearchEnabled: true,
      rewriteEnabled: true,
    };
  }
}

export async function saveAgentPreference<K extends keyof AgentPreferences>(
  key: K,
  value: AgentPreferences[K],
): Promise<void> {
  try {
    const db = await getVaultIndexDb();
    const settingKey =
      key === "autoApply"
        ? SETTING_AUTO_APPLY
        : key === "webSearchEnabled"
          ? SETTING_WEB_SEARCH
          : SETTING_REWRITE;
    await withDbLock(() => setSetting(db, settingKey, String(value)));
  } catch (err) {
    console.warn(`[agent] Failed to persist agent preference ${key}:`, err);
  }
}
