"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import DateTimePicker from "@/components/DateTimePicker";
import { Bell } from "lucide-react";
import { formatDateTime } from "@/lib/formatDate";
import { editGlobalReminder } from "@/database/reminders/edit-global-reminder";
import SubNotesInput from "@/ui/SubNotesInput";
import TitleInput from "@/ui/TitleInput";
import { useQueryClient } from "@tanstack/react-query";
import { full_reminder } from "@/types/session";
import { useAutoSave } from "@/hooks/useAutoSave";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";
import { useTranslation } from "react-i18next";

type Props = {
  reminder: full_reminder;
  onClose: () => void;
  onSave: () => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function EditMyGlobalReminder({
  reminder,
  onClose,
  onSave,
  onDirtyChange,
}: Props) {
  const { t } = useTranslation("reminders");
  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(reminder.notes);
  const [notify_at, setNotify_at] = useState(
    reminder.notify_at ? new Date(reminder.notify_at) : null
  );

  const queryClient = useQueryClient();

  const notifyAtRef = useRef(notify_at);
  notifyAtRef.current = notify_at;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const formattedNotifyAt = formatDateTime(reminder.notify_at!);

  const handleAutoSave = useCallback(
    async (data: { title: string; notes: string; notifyAtMs: number | null }) => {
      if (data.title.trim().length === 0) {
        throw new Error("Title is required");
      }

      const currentNotifyAt = notifyAtRef.current;

      if (!currentNotifyAt) {
        throw new Error("Notify time is required");
      }

      if (currentNotifyAt < new Date()) {
        throw new Error("Notify time must be in the future");
      }

      const updated = new Date().toISOString();

      const delivered =
        currentNotifyAt.getTime() > Date.now()
          ? false
          : reminder.delivered;

      await editGlobalReminder({
        id: reminder.id,
        title: data.title,
        notes: data.notes || "",
        notify_at: currentNotifyAt.toISOString(),
        delivered: delivered ?? false,
        updated_at: updated,
        seen_at: "",
      });

      await queryClient.refetchQueries({
        queryKey: ["get-reminders"],
        exact: true,
      });

      onSaveRef.current();
    },
    [reminder.id, reminder.delivered, queryClient]
  );

  const { status, hasPendingChanges } = useAutoSave({
    data: {
      title,
      notes: notes ?? "",
      notifyAtMs: notify_at?.getTime() ?? null,
    },
    onSave: handleAutoSave,
  });

  useEffect(() => {
    onDirtyChange?.(hasPendingChanges);
  }, [hasPendingChanges, onDirtyChange]);

  return (
    <div className="flex flex-col justify-between mx-auto h-full max-w-lg page-padding">
      <div className="flex flex-col gap-5">
        <AutoSaveIndicator status={status} />
        <h2 className="flex items-center justify-center gap-2 text-lg text-center mb-5">
          <p>{t("reminders.editReminder")}</p>
          <Bell />
        </h2>

        <TitleInput
          value={title || ""}
          setValue={setValue}
          placeholder={t("reminders.titlePlaceholder")}
          label={t("reminders.titleLabel")}
        />

        <div className="z-50 w-full">
          <DateTimePicker
            value={notify_at}
            onChange={setNotify_at}
            label={t("reminders.notifyAtLabel")}
            placeholder={
              notify_at
                ? formattedNotifyAt
                : t("reminders.selectDateTimePlaceholder")
            }
          />
        </div>
        <SubNotesInput
          notes={notes || ""}
          setNotes={setNotes}
          placeholder={t("reminders.notesPlaceholder")}
          label={t("reminders.notesLabel")}
        />
      </div>
    </div>
  );
}
