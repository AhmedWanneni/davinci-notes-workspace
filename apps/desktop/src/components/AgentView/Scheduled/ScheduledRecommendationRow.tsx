import { Plus } from "@phosphor-icons/react";
import type { ScheduledRecommendation } from "./scheduledRecommendations";
import styles from "./AgentScheduledView.module.scss";

export interface ScheduledRecommendationRowProps {
  item: ScheduledRecommendation;
  onAdd: () => void;
}

export function ScheduledRecommendationRow({
  item,
  onAdd,
}: ScheduledRecommendationRowProps) {
  return (
    <div className={styles["row"]}>
      <button
        type="button"
        className={styles["row__main"]}
        onClick={onAdd}
        aria-label={`Schedule ${item.title}`}
      >
        <span className={styles["row__icon"]} aria-hidden>
          {item.emoji}
        </span>
        <span className={styles["row__text"]}>
          <span className={styles["row__title"]}>{item.title}</span>
          <span className={styles["row__desc"]}>{item.description}</span>
        </span>
        <Plus size={18} className={styles["row__trailing"]} aria-hidden />
      </button>
    </div>
  );
}
