import React from "react";
import {
  Gear,
  Palette,
  Desktop,
  PencilSimpleLine,
  FolderSimple,
  Command,
  Key,
  CloudArrowUp,
  Sparkle,
  PuzzlePiece,
  TreeStructure,
  SquaresFour,
  TerminalWindow,
  CalendarBlank,
  ClockCounterClockwise,
  Compass,
  Eye,
  MagnifyingGlass,
  CopySimple,
  Globe,
} from "@phosphor-icons/react";
import { Typography } from "@app/design-system";
import styles from "./SettingsDialog.module.scss";

export type SettingsTabId =
  | "general"
  | "appearance"
  | "interface"
  | "editor"
  | "files"
  | "hotkeys"
  | "keychain"
  | "sync"
  | "ai"
  | "plugins"
  | "backlinks"
  | "canvas"
  | "command-palette"
  | "daily-notes"
  | "file-recovery"
  | "note-composer"
  | "page-preview"
  | "quick-switcher"
  | "templates"
  | string;

export interface SettingsSidebarItem {
  id: SettingsTabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: "options" | "core-plugins" | "community-plugins";
}

export const SETTINGS_SIDEBAR_ITEMS: SettingsSidebarItem[] = [
  // Options
  { id: "general", label: "General", icon: Gear, category: "options" },
  { id: "appearance", label: "Appearance", icon: Palette, category: "options" },
  { id: "interface", label: "Interface", icon: Desktop, category: "options" },
  {
    id: "editor",
    label: "Editor",
    icon: PencilSimpleLine,
    category: "options",
  },
  {
    id: "files",
    label: "Files and links",
    icon: FolderSimple,
    category: "options",
  },
  { id: "hotkeys", label: "Hotkeys", icon: Command, category: "options" },
  { id: "keychain", label: "Keychain", icon: Key, category: "options" },
  {
    id: "sync",
    label: "Sync & Backup",
    icon: CloudArrowUp,
    category: "options",
  },
  { id: "ai", label: "AI Assistant", icon: Sparkle, category: "options" },
  { id: "web-clipper", label: "Web Clipper", icon: Globe, category: "options" },
  {
    id: "plugins",
    label: "Community plugins",
    icon: PuzzlePiece,
    category: "options",
  },

  // Core Plugins
  {
    id: "backlinks",
    label: "Backlinks",
    icon: TreeStructure,
    category: "core-plugins",
  },
  {
    id: "canvas",
    label: "Canvas",
    icon: SquaresFour,
    category: "core-plugins",
  },
  {
    id: "command-palette",
    label: "Command palette",
    icon: TerminalWindow,
    category: "core-plugins",
  },
  {
    id: "daily-notes",
    label: "Daily notes",
    icon: CalendarBlank,
    category: "core-plugins",
  },
  {
    id: "file-recovery",
    label: "File recovery",
    icon: ClockCounterClockwise,
    category: "core-plugins",
  },
  {
    id: "note-composer",
    label: "Note composer",
    icon: Compass,
    category: "core-plugins",
  },
  {
    id: "page-preview",
    label: "Page preview",
    icon: Eye,
    category: "core-plugins",
  },
  {
    id: "quick-switcher",
    label: "Quick switcher",
    icon: MagnifyingGlass,
    category: "core-plugins",
  },
  {
    id: "templates",
    label: "Templates",
    icon: CopySimple,
    category: "core-plugins",
  },
];

interface SettingsSidebarProps {
  activeTab: SettingsTabId;
  onSelectTab: (tabId: SettingsTabId) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  communityPluginTabs?: Array<{ id: string; title: string }>;
}

function NavSection({
  title,
  items,
  activeTab,
  onSelectTab,
}: {
  title: string;
  items: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }>;
  activeTab: SettingsTabId;
  onSelectTab: (id: SettingsTabId) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className={styles["settings-nav-section"]}>
      <div className={styles["settings-nav-header"]}>
        <Typography variant="text" size="xs" color="muted" weight="bold">
          {title}
        </Typography>
      </div>
      <ul className={styles["settings-nav-list"]}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`${styles["settings-nav-item"]} ${
                  isActive ? styles["is-active"] : ""
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={16} className={styles["settings-nav-item-icon"]} />
                <span className={styles["settings-nav-item-label"]}>
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SettingsSidebar({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  communityPluginTabs = [],
}: SettingsSidebarProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filterItem = (item: SettingsSidebarItem) =>
    !normalizedQuery || item.label.toLowerCase().includes(normalizedQuery);

  const optionsItems = SETTINGS_SIDEBAR_ITEMS.filter(
    (item) => item.category === "options" && filterItem(item),
  );
  const corePluginItems = SETTINGS_SIDEBAR_ITEMS.filter(
    (item) => item.category === "core-plugins" && filterItem(item),
  );
  const filteredCommunityTabs = communityPluginTabs
    .filter(
      (tab) =>
        !normalizedQuery || tab.title.toLowerCase().includes(normalizedQuery),
    )
    .map((tab) => ({ id: tab.id, label: tab.title, icon: PuzzlePiece }));

  return (
    <aside className={styles["settings-sidebar"]}>
      <div className={styles["settings-search-wrapper"]}>
        <MagnifyingGlass size={16} className={styles["settings-search-icon"]} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search settings..."
          className={styles["settings-search-input"]}
          aria-label="Search settings"
        />
      </div>

      <nav className={styles["settings-nav"]} aria-label="Settings navigation">
        <NavSection
          title="Options"
          items={optionsItems}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
        />
        <NavSection
          title="Core plugins"
          items={corePluginItems}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
        />
        <NavSection
          title="Community plugins"
          items={filteredCommunityTabs}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
        />
      </nav>
    </aside>
  );
}
