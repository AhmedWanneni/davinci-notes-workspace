import { useEffect, useState } from "react";
import { CaretDown, CaretRight, CheckCircle, X } from "@phosphor-icons/react";
import { ScheduledPromptBar } from "./ScheduledPromptBar";
import { ScheduledTaskRow } from "./ScheduledTaskRow";
import { ScheduledRecommendationRow } from "./ScheduledRecommendationRow";
import { ScheduleTaskModal } from "./ScheduleTaskModal";
import { SCHEDULED_RECOMMENDATIONS } from "./scheduledRecommendations";
import { parseScheduleIntent, type ScheduleDraft } from "./parseScheduleIntent";
import { describeNextRun, describeRecurrence, toLocalSpec } from "./scheduleTime";
import { useScheduleStore, type ScheduledTask } from "./useScheduleStore";
import styles from "./AgentScheduledView.module.scss";

interface ModalState {
  draft: ScheduleDraft;
  editId: string | null;
}

const BLANK_DRAFT: ScheduleDraft = {
  title: "",
  prompt: "",
  spec: { frequency: "daily", time: "08:00", dayOfWeek: 1, intervalHours: 24 },
};

export function AgentScheduledView() {
  const schedules = useScheduleStore((s) => s.schedules);
  const isLoaded = useScheduleStore((s) => s.isLoaded);
  const lastCreatedId = useScheduleStore((s) => s.lastCreatedId);
  const store = useScheduleStore.getState;
  const [modal, setModal] = useState<ModalState | null>(null);
  const [showRecommended, setShowRecommended] = useState(true);

  useEffect(() => {
    if (!isLoaded) void store().load();
  }, [isLoaded, store]);

  const created = schedules.find((s) => s.id === lastCreatedId);
  const scheduledTitles = new Set(schedules.map((s) => s.title));
  const recommendations = SCHEDULED_RECOMMENDATIONS.filter(
    (r) => !scheduledTitles.has(r.title),
  );

  const openEdit = (task: ScheduledTask) =>
    setModal({
      editId: task.id,
      draft: {
        title: task.title,
        prompt: task.prompt,
        emoji: task.emoji,
        spec: toLocalSpec(task.recurrence),
      },
    });

  const handleSave = (draft: ScheduleDraft) => {
    if (modal?.editId) void store().updateSchedule(modal.editId, draft);
    else void store().addSchedule(draft);
    setModal(null);
  };

  return (
    <div className={styles["scheduled-view"]} role="region" aria-label="Scheduled tasks">
      <div className={styles["scheduled-view__container"]}>
        <h1 className={styles["scheduled-view__title"]}>Scheduled</h1>
        <p className={styles["scheduled-view__subtitle"]}>
          Prepared prompts the agent runs for you automatically at a set time.
        </p>

        <ScheduledPromptBar
          onSubmit={(text) => setModal({ draft: parseScheduleIntent(text), editId: null })}
          onOpenBlank={() => setModal({ draft: BLANK_DRAFT, editId: null })}
        />

        {created && (
          <div className={styles["created-notice"]} role="status">
            <div className={styles["created-notice__head"]}>
              <span className={styles["created-notice__badge"]}>
                <CheckCircle size={15} /> Created
              </span>
              <span className={styles["created-notice__title"]}>{created.title}</span>
              <button
                type="button"
                className={styles["icon-btn"]}
                onClick={() => store().clearLastCreated()}
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
            <p className={styles["created-notice__desc"]}>
              {describeRecurrence(created.recurrence)}, starting{" "}
              <strong>{describeNextRun(created.nextRunUtc)}</strong>.
            </p>
          </div>
        )}

        {schedules.length > 0 && (
          <section className={styles["section"]} aria-label="Your scheduled tasks">
            <h2 className={styles["section__header"]}>Your tasks</h2>
            {schedules.map((task) => (
              <ScheduledTaskRow
                key={task.id}
                task={task}
                onEdit={() => openEdit(task)}
                onRunNow={() => void store().runNow(task.id)}
                onToggle={() => void store().toggleSchedule(task.id)}
                onDelete={() => {
                  if (window.confirm(`Delete scheduled task "${task.title}"?`))
                    void store().removeSchedule(task.id);
                }}
              />
            ))}
          </section>
        )}

        {recommendations.length > 0 && (
          <section className={styles["section"]} aria-label="Recommended tasks">
            <button
              type="button"
              className={styles["section__toggle"]}
              onClick={() => setShowRecommended((v) => !v)}
              aria-expanded={showRecommended}
            >
              Recommended
              {showRecommended ? <CaretDown size={13} /> : <CaretRight size={13} />}
            </button>
            {showRecommended &&
              recommendations.map((item) => (
                <ScheduledRecommendationRow
                  key={item.id}
                  item={item}
                  onAdd={() =>
                    setModal({
                      editId: null,
                      draft: {
                        title: item.title,
                        prompt: item.prompt,
                        emoji: item.emoji,
                        spec: item.spec,
                      },
                    })
                  }
                />
              ))}
          </section>
        )}
      </div>

      <ScheduleTaskModal
        isOpen={modal !== null}
        initialDraft={modal?.draft ?? null}
        mode={modal?.editId ? "edit" : "create"}
        onClose={() => setModal(null)}
        onSave={handleSave}
      />
    </div>
  );
}
