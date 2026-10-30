import {
  getPlatformAdapters,
  OpfsFileSystemAdapter,
  setPlatformAdapters,
} from "@app/platform-adapters";
import type {
  FileTreeNode,
  NoteFilePayload,
  NoteStatPayload,
  VaultChangeBatch,
} from "./vaultCommands";

const DEFAULT_WELCOME_NOTES: Array<{ path: string; content: string }> = [
  {
    path: "Welcome.md",
    content: [
      "---",
      "tags: [welcome, davinci-web]",
      "---",
      "# Welcome to Sophia",
      "",
      "You are using the full Sophia workspace in your browser.",
      "",
      "- Open the [[Getting Started]] guide or check out [[Architecture]].",
      "- Press `Cmd/Ctrl + K` for the Command Palette or `Cmd/Ctrl + P` to Search.",
      "- Click the Graph icon in the left rail to explore your knowledge graph.",
      "",
      "- [ ] Try creating a new note or canvas (@2026-10-25 09:00)",
    ].join("\n"),
  },
  {
    path: "Getting Started.md",
    content: [
      "---",
      "tags: [guide, onboarding]",
      "---",
      "# Getting Started",
      "",
      "Plain `.md` files are the source of truth. Link back to [[Welcome]] or explore [[Architecture]].",
    ].join("\n"),
  },
  {
    path: "Architecture.md",
    content: [
      "---",
      "tags: [architecture, local-first]",
      "---",
      "# Architecture",
      "",
      "Sophia indexes your markdown notes, frontmatter, #tags, and [[Welcome|wikilinks]] locally.",
    ].join("\n"),
  },
];

async function populateFromDevFixture(
  fs: OpfsFileSystemAdapter,
  size: "small" | "large",
): Promise<boolean> {
  try {
    const res = await fetch(`/_dev/fixture-vault?size=${size}`);
    if (!res.ok) return false;
    const payload = (await res.json()) as {
      folders: string[];
      files: Array<{ path: string; content: string }>;
    };
    for (const folder of payload.folders) {
      await fs.createFolder(folder);
    }
    for (const file of payload.files) {
      await fs.writeTextFile(file.path, file.content);
    }
    return payload.files.length > 0;
  } catch {
    return false;
  }
}

export async function webOpenVault(path: string): Promise<string> {
  const adapters = getPlatformAdapters();

  if (path.startsWith("fsa://")) {
    return path;
  }

  const opfs = new OpfsFileSystemAdapter();
  setPlatformAdapters({ ...adapters, fs: opfs });

  const isLarge = path.includes("large-vault") || path.includes("large");
  const isFixture = path.includes("fixtures") || isLarge;

  if (isFixture) {
    const ok = await populateFromDevFixture(opfs, isLarge ? "large" : "small");
    if (ok) {
      return isLarge ? "Large Fixture Vault (350 notes)" : "Fixture Vault";
    }
  }

  for (const item of DEFAULT_WELCOME_NOTES) {
    await opfs.writeTextFile(item.path, item.content);
  }
  return path === "opfs://default-vault" ? "Browser Vault" : path;
}

export async function webListNotes(): Promise<string[]> {
  const entries = await getPlatformAdapters().fs.listEntries();
  return entries
    .filter((e) => e.kind === "file" && /\.(md|canvas)$/i.test(e.path))
    .map((e) => e.path)
    .sort();
}

export async function webListFolders(): Promise<string[]> {
  const entries = await getPlatformAdapters().fs.listEntries();
  return entries
    .filter((e) => e.kind === "directory" && !e.path.startsWith(".davinci"))
    .map((e) => e.path)
    .sort();
}

export async function webReadNote(path: string): Promise<NoteFilePayload> {
  const { fs } = getPlatformAdapters();
  const [content, stat] = await Promise.all([
    fs.readTextFile(path),
    fs.stat(path),
  ]);
  return { path, content, mtime: stat.mtime, size: stat.size };
}

export async function webStatNote(path: string): Promise<NoteStatPayload> {
  const { fs } = getPlatformAdapters();
  try {
    const stat = await fs.stat(path);
    return { exists: true, mtime: stat.mtime, size: stat.size };
  } catch {
    return { exists: false, mtime: 0, size: 0 };
  }
}

export async function webWriteNote(
  path: string,
  content: string,
): Promise<NoteStatPayload> {
  const { fs } = getPlatformAdapters();
  await fs.writeTextFile(path, content);
  const stat = await fs.stat(path);
  return { exists: true, mtime: stat.mtime, size: stat.size };
}

export async function webGetFileTree(): Promise<FileTreeNode[]> {
  const notes = await webListNotes();
  return notes.map((p) => ({
    name: p.split("/").pop() ?? p,
    path: p,
    children: [],
  }));
}

export async function webSubscribeVaultChanges(
  handler: (batch: VaultChangeBatch) => void,
): Promise<() => void> {
  return getPlatformAdapters().watcher.start((event) => {
    handler({ changed: event.paths, removed: [], renamed: [] });
  });
}
