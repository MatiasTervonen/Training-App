"use client";

import { useState } from "react";
import SaveButton from "@/app/(app)/ui/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import { mutate } from "swr";
import toast from "react-hot-toast";
import DateTimePicker from "@/app/(app)/components/DateTimePicker";
import { Bell } from "lucide-react";
import { formatDateTime } from "../../lib/formatDate";
import { editReminder } from "../../database/reminder";
import { reminders } from "../../types/models";
import SubNotesInput from "../SubNotesInput";
import TitleInput from "../TitleInput";

type Props = {
  reminder: reminders;
  onClose: () => void;
  onSave?: () => void;
};

type FeedItem = {
  table: "reminders";
  item: reminders;
  pinned: boolean;
};

export default function EditReminder({ reminder, onClose, onSave }: Props) {
  const [title, setValue] = useState(reminder.title ?? "");
  const [notes, setNotes] = useState(reminder.notes ?? "");
  const [notify_at, setNotify_at] = useState(
    reminder.notify_at ? new Date(reminder.notify_at) : null
  );
  const [isSaving, setIsSaving] = useState(false);

  const formattedNotifyAt = formatDateTime(reminder.notify_at!);

  const handleSubmit = async () => {
    setIsSaving(true);

    mutate(
      "/api/feed",
      (currentData: FeedItem[] = []) => {
        return currentData.map((item) => {
          if (item.table === "reminders" && item.item.id === reminder.id) {
            return {
              ...item,
              item: {
                ...item.item,
                title,
                notes,
                notify_at: notify_at!.toISOString(),
              },
            };
          }
          return item;
        });
      },
      false
    );

    try {
      await editReminder({
        id: reminder.id,
        title,
        notes,
        notify_at: notify_at!.toISOString(),
      });

      await onSave?.();
      onClose();

      mutate("/api/feed");
    } catch {
      toast.error("Failed to update reminder");
      mutate("/api/feed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col mx-auto w-full h-full max-w-lg px-6 pt-10">
        <div className="flex flex-col items-center gap-5 mx-6 mt-5 h-full ">
          <h2 className="flex items-center gap-2 text-gray-100 text-lg text-center">
            <p>Edit your reminder</p>
            <Bell />
          </h2>
          <div className="w-full">
            <TitleInput
              value={title || ""}
              setValue={setValue}
              placeholder="Reminder title..."
              label="Title..."
            />
          </div>
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
          <div className="w-full flex-1">
            <SubNotesInput
              notes={notes || ""}
              setNotes={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
            />
          </div>
          <div className="w-full py-10">
            <SaveButton onClick={handleSubmit} />
          </div>
        </div>
      </div>

      {isSaving && <FullScreenLoader message="Saving reminder..." />}
    </>
  );
}
