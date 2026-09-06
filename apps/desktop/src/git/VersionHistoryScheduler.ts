const AUTO_VERSION_DELAY_MS = 2_000;

type CreateVersion = (
  paths: string[],
  manual: boolean,
) => Promise<string | null>;

async function createVersion(
  paths: string[],
  manual: boolean,
): Promise<string | null> {
  const { createLocalGitVersion } = await import("./createLocalGitVersion");
  return createLocalGitVersion(paths, manual);
}

export class VersionHistoryScheduler {
  private pendingPaths = new Set<string>();
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly delayMs = AUTO_VERSION_DELAY_MS,
    private readonly commit: CreateVersion = createVersion,
  ) {}

  recordAutoSave(path: string): void {
    this.pendingPaths.add(path);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(false), this.delayMs);
  }

  async saveVersionNow(path: string): Promise<void> {
    this.pendingPaths.add(path);
    if (this.timer) clearTimeout(this.timer);
    await this.flush(true);
  }

  private async flush(manual: boolean): Promise<void> {
    this.timer = undefined;
    const paths = [...this.pendingPaths].sort();
    this.pendingPaths.clear();
    if (paths.length === 0) return;

    try {
      await this.commit(paths, manual);
    } catch (error) {
      paths.forEach((path) => this.pendingPaths.add(path));
      console.error("Failed to create local version", error);
    }
  }
}

export const versionHistoryScheduler = new VersionHistoryScheduler();
