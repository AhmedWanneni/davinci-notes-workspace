import React from "react";
import type { ReminderClickInfo } from "@app/editor";
import { ReminderDatePicker } from "./ReminderDatePicker";

export interface ReminderEditModalProps {
  reminder: ReminderClickInfo | null;
  onClose: () => void;
}

export function ReminderEditModal({
  reminder,
  onClose,
}: ReminderEditModalProps) {
  if (!reminder) return null;

  return (
    <ReminderDatePicker
      open={Boolean(reminder)}
      initialDate={reminder.date}
      initialTime={reminder.time}
      isEditing={true}
      onConfirm={({ date, time }) => {
        const timePart = time ? ` ${time}` : "";
        const newToken = `(@${date}${timePart})`;
        reminder.view.dispatch({
          changes: {
            from: reminder.from,
            to: reminder.to,
            insert: newToken,
          },
        });
        onClose();
      }}
      onDelete={() => {
        reminder.view.dispatch({
          changes: {
            from: reminder.from,
            to: reminder.to,
            insert: "",
          },
        });
        onClose();
      }}
      onCancel={onClose}
    />
  );
}
