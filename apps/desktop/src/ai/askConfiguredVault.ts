import type { AskYourVaultResult } from "@app/ai-qa";
import type { SqliteLike } from "@app/ai-embeddings";
import { getVaultIndexDb, withDbLock } from "../vault";
import { loadAISubsystem } from "./loadAISubsystem";

/** Runs Q&A only after the panel has been enabled; the package stays lazy until a question is asked. */
export async function askConfiguredVault(question: string): Promise<AskYourVaultResult> {
  const [ai, { askYourVault }] = await Promise.all([loadAISubsystem(), import("@app/ai-qa")]);
  const providerId = await ai.loadSelectedProvider();
  const provider = await ai.createConfiguredProvider(providerId);
  const db = await getVaultIndexDb();
  const lockedDb: SqliteLike = {
    execute: (sql, bindValues) => withDbLock(() => db.execute(sql, bindValues)),
    select: <T>(sql: string, bindValues?: unknown[]) => withDbLock(() => db.select<T>(sql, bindValues)),
  };
  try {
    return await askYourVault(question, provider, lockedDb, {
      isConsented: () => ai.loadAIConsent("ask-vault"),
    });
  } finally {
    await provider.dispose();
  }
}
