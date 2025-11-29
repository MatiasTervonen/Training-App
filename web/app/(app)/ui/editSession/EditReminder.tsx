"use client";

import { useState } from "react";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import DateTimePicker from "@/app/(app)/components/DateTimePicker";
import { Bell } from "lucide-react";
import { formatDateTime } from "../../lib/formatDate";
import { editReminder } from "../../database/reminder";
import { reminders } from "../../types/models";
import SubNotesInput from "../SubNotesInput";
import TitleInput from "../TitleInput";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  reminder: reminders;
  onClose: () => void;
  onSave?: () => void;
};

export default function EditReminder({ reminder, onClose, onSave }: Props) {
  const [title, setValue] = useState(reminder.title);
  const [notes, setNotes] = useState(reminder.notes);
  const [notify_at, setNotify_at] = useState(
    reminder.notify_at ? new Date(reminder.notify_at) : null
  );
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();

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

    const delivereStatus =
      notify_at && notify_at.getTime() > Date.now()
        ? false
        : reminder.delivered;

    try {
      await editReminder({
        id: reminder.id,
        title,
        notes,
        notify_at: notify_at!.toISOString(),
        delivered: delivereStatus,
        updated_at: updated,
      });

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        }),
        onSave?.() ?? Promise.resolve(),
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
