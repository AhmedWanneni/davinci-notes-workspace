import React from "react";
import { CaretRight } from "@phosphor-icons/react";
import styles from "./AgentPromptMenu.module.scss";

export interface SubmenuItem {
  id: string | number;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface AgentPromptSubmenuProps {
  header: string;
  items: SubmenuItem[];
  footerLink?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
}

export function AgentPromptSubmenu({
  header,
  items,
  footerLink,
  onClose,
}: AgentPromptSubmenuProps) {
  return (
    <div className={styles["menu__submenu"]}>
      <div className={styles["menu__sub-header"]}>{header}</div>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={styles["menu__sub-item"]}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
      {footerLink && (
        <button
          type="button"
          className={styles["menu__sub-item"]}
          onClick={() => {
            footerLink.onClick();
            onClose();
          }}
        >
          <span style={{ color: "var(--color-text-accent)", fontWeight: 500 }}>
            {footerLink.label}
          </span>
        </button>
      )}
    </div>
  );
}

export interface AgentPromptMenuWrapProps {
  icon: React.ReactNode;
  label: string;
  submenuKey: string;
  activeSubmenu: string | null;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}

export function AgentPromptMenuWrap({
  icon,
  label,
  submenuKey,
  activeSubmenu,
  onToggle,
  children,
}: AgentPromptMenuWrapProps) {
  return (
    <div
      className={styles["menu__item-wrap"]}
      onMouseEnter={() => onToggle(submenuKey)}
    >
      <button
        type="button"
        className={styles["menu__item"]}
        onClick={() => onToggle(submenuKey)}
      >
        {icon}
        <span className={styles["menu__item-text"]}>{label}</span>
        <CaretRight size={13} weight="bold" className={styles["menu__caret"]} />
      </button>
      {activeSubmenu === submenuKey && children}
    </div>
  );
}
