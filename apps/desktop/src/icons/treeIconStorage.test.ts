import { beforeEach, describe, expect, it, vi } from "vitest";

const readNote = vi.fn();
const writeNote = vi.fn();
const persistNote = vi.fn();
const getVaultIndexDb = vi.fn();
const withDbLock = vi.fn(
  async <T>(fn: () => Promise<T>) => fn(),
);
const withVaultWatchSuppressed = vi.fn(
  async <T>(fn: () => Promise<T>) => fn(),
);

vi.mock("../vault", () => ({
  readNote: (...args: unknown[]) => readNote(...args),
  writeNote: (...args: unknown[]) => writeNote(...args),
  persistNote: (...args: unknown[]) => persistNote(...args),
  getVaultIndexDb: (...args: unknown[]) => getVaultIndexDb(...args),
  withDbLock: (...args: unknown[]) => withDbLock(...args),
  withVaultWatchSuppressed: (...args: unknown[]) =>
    withVaultWatchSuppressed(...args),
  noteFromMarkdown: (path: string, raw: string) => ({
    path,
    title: path,
    frontmatter: { icon: "🚀" },
    content: raw,
    outlinks: [],
    tags: { frontmatter: [], inline: [], all: [] },
    mtime: 1,
  }),
}));

const storeState = {
  notesContent: {} as Record<string, string>,
  dirtyNotes: new Set<string>(),
  allNotePaths: ["note.md"],
};

vi.mock("../state/useWorkspaceStore", () => ({
  useWorkspaceStore: Object.assign(
    () => storeState,
    {
      getState: () => storeState,
      setState: (
        updater: (current: typeof storeState) => Partial<typeof storeState>,
      ) => {
        Object.assign(storeState, updater(storeState));
      },
    },
  ),
}));

import {
  ICONS_JSON_PATH,
  iconsFromNoteFrontmatter,
  loadTreeIcons,
  mappedIconsOnly,
  persistTreeIcon,
} from "./treeIconStorage";

describe("tree icon storage", () => {
  beforeEach(() => {
    readNote.mockReset();
    writeNote.mockReset().mockResolvedValue(undefined);
    persistNote.mockReset().mockResolvedValue(undefined);
    getVaultIndexDb.mockReset();
    storeState.notesContent = {};
    storeState.dirtyNotes = new Set();
  });

  it("keeps all paths in the vault icon map", () => {
    expect(
      mappedIconsOnly({ "note.md": "🚀", folder: "📁", "board.canvas": "🎨" }),
    ).toEqual({ "note.md": "🚀", folder: "📁", "board.canvas": "🎨" });
  });

  it("reads valid emoji icons from indexed frontmatter", () => {
    expect(
      iconsFromNoteFrontmatter([
        { path: "a.md", frontmatter: '{"icon":"🚀","title":"A"}' },
        { path: "b.md", frontmatter: '{"icon":"nope"}' },
        { path: "c.md", frontmatter: "not-json" },
      ]),
    ).toEqual({ "a.md": "🚀" });
  });

  it("loads mapped icons and note frontmatter together", async () => {
    readNote.mockResolvedValue({
      path: ICONS_JSON_PATH,
      content: '{\n  "folder": "📁"\n}\n',
      mtime: 1,
    });
    getVaultIndexDb.mockResolvedValue({
      select: vi.fn().mockResolvedValue([
        { path: "a.md", frontmatter: '{"icon":"🚀"}' },
      ]),
    });

    await expect(loadTreeIcons()).resolves.toEqual({
      folder: "📁",
      "a.md": "🚀",
    });
  });

  it("writes markdown icons to .davinci/icons.json without touching markdown note", async () => {
    await persistTreeIcon("note.md", "🚀", {});

    expect(writeNote).toHaveBeenCalledWith(
      ICONS_JSON_PATH,
      '{\n  "note.md": "🚀"\n}\n',
    );
  });

  it("writes folder icons to .davinci/icons.json", async () => {
    await persistTreeIcon("projects", "📁", { "note.md": "🚀" });
    expect(writeNote).toHaveBeenCalledWith(
      ICONS_JSON_PATH,
      '{\n  "note.md": "🚀",\n  "projects": "📁"\n}\n',
    );
  });
});
