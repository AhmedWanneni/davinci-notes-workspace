import { useState } from "react";
import {
  Image as ImageIcon,
  Table as TableIcon,
  Code as CodeIcon,
  VideoCamera,
  Link as LinkIcon,
  Smiley,
  Function as FunctionIcon,
  Minus,
  Browsers,
  ChatText,
  CaretRight,
} from "@phosphor-icons/react";
import {
  MENU_ITEMS,
  type MenuItemConfig,
  type SubmenuItem,
} from "./editorMenuConfig";
import styles from "./EditorMenuBar.module.scss";

export interface EditorMenuBarDropdownProps {
  onInsert: (snippet: string, cursorOffset?: number) => void;
  onOpenImagePicker?: () => void;
}

function renderItemIcon(icon: string) {
  switch (icon) {
    case "image":
      return <ImageIcon size={16} />;
    case "table":
      return <TableIcon size={16} />;
    case "code":
      return <CodeIcon size={16} />;
    case "video":
      return <VideoCamera size={16} />;
    case "link":
      return <LinkIcon size={16} />;
    case "symbols":
      return <Smiley size={16} />;
    case "equation":
      return <FunctionIcon size={16} />;
    case "minus":
      return <Minus size={16} />;
    case "browsers":
      return <Browsers size={16} />;
    case "chat":
      return <ChatText size={16} />;
    default:
      return null;
  }
}

export function EditorMenuBarDropdown({
  onInsert,
  onOpenImagePicker,
}: EditorMenuBarDropdownProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const handleItemClick = (item: MenuItemConfig) => {
    if (item.subitems && item.subitems.length > 0) {
      setActiveSubmenu((prev) => (prev === item.id ? null : item.id));
      return;
    }
    if (item.id === "video") {
      const url = window.prompt("Enter YouTube or video URL:");
      if (url && url.trim()) {
        onInsert(`\n![Video](${url.trim()})\n`);
      }
      return;
    }
    if (item.snippet) {
      onInsert(item.snippet, item.cursorOffset);
    }
  };

  const handleSubitemClick = (sub: SubmenuItem) => {
    if (sub.id === "img-disk" && onOpenImagePicker) {
      onOpenImagePicker();
      return;
    }
    onInsert(sub.snippet, sub.cursorOffset);
  };

  return (
    <div className={styles["menu-bar__dropdown"]} role="menu">
      {MENU_ITEMS.map((item) => {
        if (item.icon === "divider") {
          return <div key={item.id} className={styles["menu-bar__divider"]} />;
        }

        const hasSubitems = item.subitems && item.subitems.length > 0;
        const isSubmenuOpen = activeSubmenu === item.id;

        return (
          <div
            key={item.id}
            className={styles["menu-bar__item-wrap"]}
            onMouseEnter={() => hasSubitems && setActiveSubmenu(item.id)}
          >
            <button
              type="button"
              className={`${styles["menu-bar__item"]} ${
                isSubmenuOpen ? styles["is-open"] : ""
              }`}
              onClick={() => handleItemClick(item)}
            >
              <span className={styles["menu-bar__item-icon"]}>
                {renderItemIcon(item.icon)}
              </span>
              <span className={styles["menu-bar__item-text"]}>
                {item.label}
              </span>
              {item.badge && (
                <span className={styles["menu-bar__item-badge"]}>
                  {item.badge}
                </span>
              )}
              {item.shortcut && (
                <span className={styles["menu-bar__item-shortcut"]}>
                  {item.shortcut}
                </span>
              )}
              {hasSubitems && (
                <CaretRight size={13} className={styles["menu-bar__caret"]} />
              )}
            </button>

            {hasSubitems && isSubmenuOpen && (
              <div className={styles["menu-bar__submenu"]}>
                {item.subitems?.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    className={styles["menu-bar__sub-item"]}
                    onClick={() => handleSubitemClick(sub)}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
