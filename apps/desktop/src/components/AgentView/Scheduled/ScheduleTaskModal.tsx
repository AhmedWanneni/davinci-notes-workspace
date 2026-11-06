import { useEffect, useState } from "react";
import { WEEKDAY_NAMES, type ScheduleFrequency } from "./scheduleTime";
import type { ScheduleDraft } from "./parseScheduleIntent";
import { WindowDialog } from "../../WindowDialog";
import styles from "./ScheduleTaskModal.module.scss";

export interface ScheduleTaskModalProps {
  isOpen: boolean;
  /** Pre-filled values (from a recommendation, free text, or an existing task). */
  initialDraft: ScheduleDraft | null;
  mode?: "create" | "edit";
  onClose: () => void;
  onSave: (draft: ScheduleDraft) => void;
}

const FREQUENCIES: { id: ScheduleFrequency; label: string }[] = [
  { id: "daily", label: "Every day" },
  { id: "weekly", label: "Every week" },
  { id: "interval", label: "Every few hours" },
];

export function ScheduleTaskModal({
  isOpen,
  initialDraft,
  mode = "create",
  onClose,
  onSave,
}: ScheduleTaskModalProps) {
  const [draft, setDraft] = useState<ScheduleDraft | null>(initialDraft);

  useEffect(() => {
    if (isOpen) setDraft(initialDraft);
  }, [isOpen, initialDraft]);

  if (!draft) return null;
  const { spec } = draft;
  const setSpec = (patch: Partial<ScheduleDraft["spec"]>) =>
    setDraft({ ...draft, spec: { ...spec, ...patch } });
  const canSave = draft.title.trim() !== "" && draft.prompt.trim() !== "";
  const title = mode === "edit" ? "Edit scheduled task" : "Schedule a task";

  return (
    <WindowDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <form
        className={styles["dialog-body"]}
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) onSave(draft);
        }}
      >
            <label className={styles["field-row"]}>
              <span className={styles["field-label"]}>Title</span>
              <input
                className={styles["field-input"]}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Daily outfit suggestion"
                autoFocus
              />
            </label>
            <label className={styles["field-row"]}>
              <span className={styles["field-label"]}>Repeat</span>
              <select
                className={styles["field-input"]}
                value={spec.frequency}
                onChange={(e) => setSpec({ frequency: e.target.value as ScheduleFrequency })}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </label>
            {spec.frequency === "weekly" && (
              <label className={styles["field-row"]}>
                <span className={styles["field-label"]}>Day</span>
                <select
                  className={styles["field-input"]}
                  value={spec.dayOfWeek}
                  onChange={(e) => setSpec({ dayOfWeek: Number(e.target.value) })}
                >
                  {WEEKDAY_NAMES.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </label>
            )}
            {spec.frequency === "interval" ? (
              <label className={styles["field-row"]}>
                <span className={styles["field-label"]}>Every (hours)</span>
                <input
                  type="number"
                  min={1}
                  className={styles["field-input"]}
                  value={spec.intervalHours}
                  onChange={(e) => setSpec({ intervalHours: Math.max(1, Number(e.target.value) || 1) })}
                />
              </label>
            ) : (
              <label className={styles["field-row"]}>
                <span className={styles["field-label"]}>Time</span>
                <input
                  type="time"
                  className={styles["field-input"]}
                  value={spec.time}
                  onChange={(e) => setSpec({ time: e.target.value })}
                />
              </label>
            )}

            <div className={styles["menu-divider"]} />

            <label className={styles["field-stack"]}>
              <span className={styles["field-label"]}>Prompt</span>
              <textarea
                className={styles["field-textarea"]}
                value={draft.prompt}
                onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
                placeholder="What should the agent do each time?"
                rows={5}
              />
            </label>

            <div className={styles["dialog-footer"]}>
              <button type="submit" className={styles["save-btn"]} disabled={!canSave}>
                {mode === "edit" ? "Save changes" : "Schedule"}
              </button>
            </div>
          </form>
    </WindowDialog>
  );
}
