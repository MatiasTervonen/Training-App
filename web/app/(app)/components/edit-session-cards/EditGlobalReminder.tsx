"use client";

import { useState, useEffect } from "react";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import DateTimePicker from "@/app/(app)/components/DateTimePicker";
import { Bell } from "lucide-react";
import { formatDateTime } from "@/app/(app)/lib/formatDate";
import { editGlobalReminder } from "@/app/(app)/database/reminders/edit-global-reminder";
import SubNotesInput from "@/app/(app)/ui/SubNotesInput";
import TitleInput from "@/app/(app)/ui/TitleInput";
import { useQueryClient } from "@tanstack/react-query";
import { FeedItemUI } from "@/app/(app)/types/session";

type Props = {
  reminder: FeedItemUI;
  onClose: () => void;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

type ReminderPayload = {
  notes: string;
  notify_at: string;
  delivered: boolean;
};

export default function EditGlobalReminder({
  reminder,
  onClose,
  onSave,
  onDirtyChange,
}: Props) {
  const payload = reminder.extra_fields as unknown as ReminderPayload;

  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(payload.notes);
  const [notify_at, setNotify_at] = useState(
    payload.notify_at ? new Date(payload.notify_at) : null
  );
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

  const originalNotifyAt = payload.notify_at ? new Date(payload.notify_at).getTime() : null;
  const currentNotifyAt = notify_at ? notify_at.getTime() : null;
  const hasChanges =
    title !== reminder.title ||
    notes !== payload.notes ||
    currentNotifyAt !== originalNotifyAt;

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const formattedNotifyAt = formatDateTime(payload.notify_at!);

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
      notify_at && notify_at.getTime() > Date.now() ? false : payload.delivered;

    try {
      const updatedFeedItem = await editGlobalReminder({
        id: reminder.source_id,
        title,
        notes,
        notify_at: notify_at.toISOString(),
        delivered: delivered,
        updated_at: updated,
        seen_at: updated,
      });

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        }),
        onSave(updatedFeedItem as FeedItemUI),
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
