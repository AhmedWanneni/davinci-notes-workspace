import { Clock, Pause, Play, Trash } from "@phosphor-icons/react";
import { describeNextRun, describeRecurrence } from "./scheduleTime";
import type { ScheduledTask } from "./useScheduleStore";
import styles from "./AgentScheduledView.module.scss";

export interface ScheduledTaskRowProps {
  task: ScheduledTask;
  onEdit: () => void;
  onRunNow: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

export function ScheduledTaskRow({
  task,
  onEdit,
  onRunNow,
  onToggle,
  onDelete,
}: ScheduledTaskRowProps) {
  const cadence = describeRecurrence(task.recurrence);
  const status = task.enabled
    ? `Next: ${describeNextRun(task.nextRunUtc)}`
    : "Paused";

  return (
    <div className={`${styles["row"]} ${task.enabled ? "" : styles["is-paused"]}`}>
      <button
        type="button"
        className={styles["row__main"]}
        onClick={onEdit}
        aria-label={`Edit ${task.title}`}
      >
        <span className={styles["row__icon"]} aria-hidden>
          {task.emoji ?? <Clock size={18} />}
        </span>
        <span className={styles["row__text"]}>
          <span className={styles["row__title"]}>{task.title}</span>
          <span className={styles["row__desc"]}>
            {cadence} · {status}
          </span>
        </span>
      </button>
      <div className={styles["row__actions"]}>
        <button
          type="button"
          className={styles["icon-btn"]}
          onClick={onRunNow}
          title="Run now"
          aria-label={`Run ${task.title} now`}
        >
          <Play size={15} />
        </button>
        <button
          type="button"
          className={styles["icon-btn"]}
          onClick={onToggle}
          title={task.enabled ? "Pause" : "Resume"}
          aria-label={task.enabled ? `Pause ${task.title}` : `Resume ${task.title}`}
        >
          {task.enabled ? <Pause size={15} /> : <Clock size={15} />}
        </button>
        <button
          type="button"
          className={styles["icon-btn"]}
          onClick={onDelete}
          title="Delete"
          aria-label={`Delete ${task.title}`}
        >
          <Trash size={15} />
        </button>
      </div>
    </div>
  );
}
