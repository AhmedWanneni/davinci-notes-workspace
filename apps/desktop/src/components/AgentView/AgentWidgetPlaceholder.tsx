import { Sparkle } from "@phosphor-icons/react";
import styles from "./AgentWidgetPlaceholder.module.scss";

export function AgentWidgetPlaceholder() {
  return (
    <div
      className={styles["widget-placeholder"]}
      role="status"
      aria-label="Generating interactive widget"
    >
      <Sparkle
        size={18}
        weight="fill"
        className={styles["widget-placeholder__icon"]}
      />
      <span className={styles["widget-placeholder__text"]}>
        Generating interactive widget...
      </span>
    </div>
  );
}
