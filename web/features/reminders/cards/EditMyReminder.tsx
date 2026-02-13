"use client";

import { useState, useEffect } from "react";
import SaveButton from "@/components/buttons/save-button";
import FullScreenLoader from "@/components/FullScreenLoader";
import toast from "react-hot-toast";
import DateTimePicker from "@/components/DateTimePicker";
import { Bell } from "lucide-react";
import { formatDateTime } from "@/lib/formatDate";
import { editGlobalReminder } from "@/database/reminders/edit-global-reminder";
import SubNotesInput from "@/ui/SubNotesInput";
import TitleInput from "@/ui/TitleInput";
import { useQueryClient } from "@tanstack/react-query";
import { full_reminder } from "@/types/session";

type Props = {
  reminder: full_reminder;
  onClose: () => void;
  onSave: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export default function EditMyGlobalReminder({
  reminder,
  onClose,
  onSave,
  onDirtyChange,
}: Props) {
  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(reminder.notes);
  const [notify_at, setNotify_at] = useState(
    reminder.notify_at ? new Date(reminder.notify_at) : null
  );
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

  const originalNotifyAt = reminder.notify_at ? new Date(reminder.notify_at).getTime() : null;
  const currentNotifyAt = notify_at ? notify_at.getTime() : null;
  const hasChanges =
    title !== reminder.title ||
    notes !== reminder.notes ||
    currentNotifyAt !== originalNotifyAt;

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const formattedNotifyAt = formatDateTime(reminder.notify_at!);

  const handleSubmit = async () => {
    if (title.trim().length === 0) {
      toast.error("Title is required");
      return;
    }
    if (!notify_at) {
      toast.error("Notify time is required");
      return;
    }

    if (notify_at < new Date()) {
      toast.error("Notify time must be in the future.");
      return;
    }

    const updated = new Date().toISOString();

    setIsSaving(true);

    const delivered =
      notify_at && notify_at.getTime() > Date.now()
        ? false
        : reminder.delivered;

    try {
      await editGlobalReminder({
        id: reminder.id,
        title,
        notes: notes || "",
        notify_at: notify_at ? notify_at.toISOString() : "",
        delivered: delivered ?? false,
        updated_at: updated,
        seen_at: "",
      });

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        }),
        onSave(),
      ]);
      onClose();
    } catch {
      toast.error("Failed to update reminder");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col justify-between mx-auto h-full max-w-lg page-padding">
        <div className="flex flex-col gap-5">
          <h2 className="flex items-center justify-center gap-2 text-lg text-center mb-5">
            <p>Edit your reminder</p>
            <Bell />
          </h2>

          <TitleInput
            value={title || ""}
            setValue={setValue}
            placeholder="Reminder title..."
            label="Title..."
          />

          <div className="z-50 w-full">
            <DateTimePicker
              value={notify_at}
              onChange={setNotify_at}
              label="Notify at:"
              placeholder={
                notify_at
                  ? formattedNotifyAt
                  : "Select date and time (required)"
              }
            />
          </div>
          <SubNotesInput
            notes={notes || ""}
            setNotes={setNotes}
            placeholder="Write your notes here..."
            label="Notes..."
          />
        </div>
        <div className="pt-10">
          <SaveButton onClick={handleSubmit} />
        </div>
      </div>
      {isSaving && <FullScreenLoader message="Saving reminder..." />}
    </>
  );
}
