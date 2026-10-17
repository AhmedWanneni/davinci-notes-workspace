import type { MobileVaultStorageAdapter } from "./MobileVaultStorageAdapter";
import { normalizeVaultPath } from "./pathUtils";

/**
 * Finds a unique note filename in the specified folder:
 * - "Untitled.md"
 * - "Untitled 1.md"
 * - "Untitled 2.md", etc.
 *
 * Guarantees that new notes are created with a non-colliding name up front,
 * preventing rename-on-open failures and FileAlreadyExistsException.
 */
export async function generateUniqueNotePath(
  adapter: MobileVaultStorageAdapter,
  folder = "",
  baseStem = "Untitled",
): Promise<string> {
  const cleanFolder = folder ? normalizeVaultPath(folder) : "";
  const makePath = (stem: string) =>
    cleanFolder ? `${cleanFolder}/${stem}.md` : `${stem}.md`;

  const initialPath = makePath(baseStem);
  const initialStat = await adapter.statFile(initialPath);
  if (!initialStat.exists) {
    return initialPath;
  }

  let counter = 1;
  while (counter < 1000) {
    const candidatePath = makePath(`${baseStem} ${counter}`);
    const stat = await adapter.statFile(candidatePath);
    if (!stat.exists) {
      return candidatePath;
    }
    counter++;
  }

  // Fallback with timestamp if many notes exist
  return makePath(`${baseStem}_${Date.now().toString(36)}`);
}
