import { discoverThemes } from "./discoverThemes";
import type {
  ThemeDiscoveryError,
  ThemeFileSystemAdapter,
  ThemeRecord,
  ThemeStateStorage,
} from "./themeTypes";

const THEME_STYLE_ATTRIBUTE = "data-davinci-theme";

export class ThemeLifecycleManager {
  private readonly fsAdapter: ThemeFileSystemAdapter;
  private readonly storage: ThemeStateStorage;
  private themes = new Map<string, ThemeRecord>();
  private discoveryErrors: ThemeDiscoveryError[] = [];
  private activeThemeId: string | null = null;
  private activeStyle: HTMLStyleElement | null = null;
  private listeners = new Set<() => void>();
  private activationGeneration = 0;
  private persistence = Promise.resolve();

  constructor(fsAdapter: ThemeFileSystemAdapter, storage: ThemeStateStorage) {
    this.fsAdapter = fsAdapter;
    this.storage = storage;
  }

  async initialize(): Promise<void> {
    const discovery = await discoverThemes(this.fsAdapter);
    this.themes = discovery.themes;
    this.discoveryErrors = discovery.errors;
    const savedThemeId = await this.storage
      .loadActiveThemeId()
      .catch(() => null);
    if (savedThemeId && this.themes.has(savedThemeId))
      await this.activateTheme(savedThemeId, false);
    else await this.activateTheme(null, false);
    this.notify();
  }

  getThemes(): ThemeRecord[] {
    return [...this.themes.values()];
  }
  getDiscoveryErrors(): ThemeDiscoveryError[] {
    return [...this.discoveryErrors];
  }
  getActiveThemeId(): string | null {
    return this.activeThemeId;
  }

  async activateTheme(
    themeId: string | null,
    persist = true,
  ): Promise<boolean> {
    if (themeId !== null && !this.themes.has(themeId)) return false;
    if (themeId === this.activeThemeId) return true;
    const generation = ++this.activationGeneration;
    const nextStyle =
      themeId === null
        ? null
        : await this.createStyle(this.themes.get(themeId)!);
    if (generation !== this.activationGeneration) return false;
    const previousStyle = this.activeStyle;
    if (nextStyle) document.head.append(nextStyle);
    previousStyle?.remove();
    this.activeStyle = nextStyle;
    this.activeThemeId = themeId;
    if (persist) await this.persist(themeId);
    this.notify();
    return true;
  }

  onStateChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async unload(): Promise<void> {
    this.activationGeneration += 1;
    this.activeStyle?.remove();
    this.activeStyle = null;
    this.activeThemeId = null;
    await this.persist(null);
    this.notify();
  }

  private async createStyle(theme: ThemeRecord): Promise<HTMLStyleElement> {
    const css = await this.fsAdapter.readThemeFile(
      theme.dirName,
      theme.manifest.styles,
    );
    const style = document.createElement("style");
    style.setAttribute(THEME_STYLE_ATTRIBUTE, theme.id);
    style.textContent = css;
    return style;
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  private async persist(themeId: string | null): Promise<void> {
    this.persistence = this.persistence
      .then(() => this.storage.saveActiveThemeId(themeId))
      .catch(() => undefined);
    await this.persistence;
  }
}
