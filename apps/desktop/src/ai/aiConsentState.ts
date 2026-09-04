import { getSetting, getVaultIndexDb, setSetting, withDbLock } from "../vault";

const KEY_PREFIX = "ai.consent.";
export type AIConsentFeature = "cloud" | "semantic-search" | "suggest-links" | "ask-vault";

export async function loadAIConsent(feature: AIConsentFeature): Promise<boolean> {
  const db = await getVaultIndexDb();
  return withDbLock(async () =>
    (await getSetting(db, `${KEY_PREFIX}${feature}`)) === "enabled",
  );
}

export async function saveAIConsent(feature: AIConsentFeature, enabled: boolean): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(() =>
    setSetting(db, `${KEY_PREFIX}${feature}`, enabled ? "enabled" : "disabled"),
  );
}

export async function disableAllAIConsent(): Promise<void> {
  for (const feature of ["cloud", "semantic-search", "suggest-links", "ask-vault"] as AIConsentFeature[]) {
    await saveAIConsent(feature, false);
  }
}
