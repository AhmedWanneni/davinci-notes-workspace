import { discoverThemes } from "./discoverThemes";
import { createBuiltinThemes } from "./builtinThemes";
import type {
  ThemeDiscoveryError,
  ThemeFileSystemAdapter,
  ThemeRecord,
  ThemeStateStorage,
} from "./themeTypes";

const THEME_STYLE_ATTRIBUTE = "data-davinci-theme";

export class ThemeLifecycleManager {
  private readonly fsAdapter: ThemeFileSystemAdapter | null;
  private readonly storage: ThemeStateStorage;
  private themes = new Map<string, ThemeRecord>();
  private discoveryErrors: ThemeDiscoveryError[] = [];
  private activeThemeId: string | null = null;
  private activeStyle: HTMLStyleElement | null = null;
  private listeners = new Set<() => void>();
  private activationGeneration = 0;
  private persistence = Promise.resolve();

  constructor(
    fsAdapter: ThemeFileSystemAdapter | null,
    storage: ThemeStateStorage,
    private readonly builtinThemes = createBuiltinThemes(),
  ) {
    this.fsAdapter = fsAdapter;
    this.storage = storage;
  }

  async initialize(): Promise<void> {
    const discovery = await discoverThemes(this.fsAdapter, this.builtinThemes);
    this.themes = discovery.themes;
    this.discoveryErrors = discovery.errors;
    const savedThemeId = await this.storage
      .loadActiveThemeId()
      .catch(() => null);
    const savedTheme = savedThemeId ? this.themes.get(savedThemeId) : null;
    const cachedStyle =
      savedTheme?.source === "builtin"
        ? ([
            ...document.querySelectorAll<HTMLStyleElement>(
              "style[data-davinci-theme]",
            ),
          ].find(
            (style) =>
              style.getAttribute(THEME_STYLE_ATTRIBUTE) === savedThemeId,
          ) ?? null)
        : null;
    if (savedThemeId && this.themes.has(savedThemeId)) {
      if (savedTheme?.source === "builtin") {
        await this.activateTheme(savedThemeId, true);
      } else if (cachedStyle) {
        this.activeThemeId = savedThemeId;
        this.activeStyle = cachedStyle;
      } else {
        await this.activateTheme(savedThemeId, false);
      }
    } else {
      this.removeThemeStyles();
      await this.activateTheme(null, false);
    }
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
    const previousStyles = [
      ...document.querySelectorAll<HTMLStyleElement>(
        "style[data-davinci-theme]",
      ),
    ];
    if (nextStyle) document.head.append(nextStyle);
    previousStyles.forEach((style) => style.remove());
    this.activeStyle = nextStyle;
    this.activeThemeId = themeId;
    if (persist) await this.persist(themeId, nextStyle?.textContent ?? null);
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
    this.notify();
  }

  private async createStyle(theme: ThemeRecord): Promise<HTMLStyleElement> {
    const css = theme.loadStyles
      ? await theme.loadStyles()
      : await this.readVaultTheme(theme);
    const style = document.createElement("style");
    style.setAttribute(THEME_STYLE_ATTRIBUTE, theme.id);
    style.textContent = css;
    return style;
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  private async readVaultTheme(theme: ThemeRecord): Promise<string> {
    if (!this.fsAdapter) throw new Error(`Theme ${theme.id} is unavailable`);
    return this.fsAdapter.readThemeFile(theme.dirName, theme.manifest.styles);
  }

  private removeThemeStyles(): void {
    document
      .querySelectorAll<HTMLStyleElement>("style[data-davinci-theme]")
      .forEach((style) => style.remove());
  }

  private async persist(
    themeId: string | null,
    css: string | null,
  ): Promise<void> {
    const source = themeId ? (this.themes.get(themeId)?.source ?? null) : null;
    this.persistence = this.persistence
      .then(() => this.storage.saveActiveTheme(themeId, css, source))
      .catch(() => undefined);
    await this.persistence;
  }
}
