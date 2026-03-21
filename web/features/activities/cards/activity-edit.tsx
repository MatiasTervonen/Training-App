"use client";

import { useState, useCallback, useEffect } from "react";
import { editActivitySession } from "@/database/activities/edit-activity-session";
import { FeedItemUI } from "@/types/session";
import TitleInput from "@/ui/TitleInput";
import NotesInput from "@/ui/NotesInput";
import {
  FullActivitySession,
  activities_with_category,
} from "@/types/models";
import ActivityDropdown from "@/features/activities/components/ActivityDropdown";
import { useTranslation } from "react-i18next";
import Modal from "@/components/modal";
import { useAutoSave } from "@/hooks/useAutoSave";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";

type Props = {
  activity: FullActivitySession & { feed_context: "pinned" | "feed" };
  onClose: () => void;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function EditActivity({ activity, onClose, onSave, onDirtyChange }: Props) {
  const { t } = useTranslation("activities");

  const [title, setTitle] = useState(activity.session.title || "");
  const [notes, setNotes] = useState(activity.session.notes || "");
  const [selectedActivity, setSelectedActivity] =
    useState<activities_with_category | null>(
      activity.activity as activities_with_category,
    );
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAutoSave = useCallback(
    async (data: { title: string; notes: string; activityId: string | undefined }) => {
      if (data.title.trim() === "") {
        throw new Error("Empty title");
      }

      if (!data.activityId) {
        throw new Error("No activity selected");
      }

      const updatedFeedItem = await editActivitySession({
        id: activity.session.id,
        title: data.title,
        notes: data.notes,
        activityId: data.activityId,
      });

      onSave({ ...updatedFeedItem, feed_context: activity.feed_context });
    },
    [activity.session.id, activity.feed_context, onSave],
  );

  const { status, hasPendingChanges } = useAutoSave({
    data: { title, notes, activityId: selectedActivity?.id },
    onSave: handleAutoSave,
  });

  useEffect(() => {
    onDirtyChange?.(hasPendingChanges);
  }, [hasPendingChanges, onDirtyChange]);

  const getActivityName = (act: activities_with_category | null) => {
    if (!act) return t("activities.editSession.selectActivity");
    if (act.slug) {
      const translated = t(`activities.activityNames.${act.slug}`, {
        defaultValue: "",
      });
      if (translated && translated !== `activities.activityNames.${act.slug}`) {
        return translated;
      }
    }
    return act.name;
  };

  return (
    <>
      <AutoSaveIndicator status={status} />

      <div className="flex flex-col h-full max-w-lg mx-auto page-padding">
        <div className="flex flex-col justify-between items-center gap-5 min-h-full">
          <div className="w-full flex flex-col gap-5">
            <h2 className="text-lg text-center mb-5">
              {t("activities.editSession.title")}
            </h2>
            <TitleInput
              value={title}
              setValue={setTitle}
              placeholder={t("activities.editSession.sessionTitlePlaceholder")}
              label={t("activities.editSession.sessionTitleLabel")}
            />
            <NotesInput
              notes={notes}
              setNotes={setNotes}
              placeholder={t("activities.editSession.sessionNotesPlaceholder")}
              label={t("activities.editSession.sessionNotesLabel")}
            />
            <div>
              <p className="mb-2 text-gray-300">
                {t("activities.editSession.selectActivity")}
              </p>
              <button
                onClick={() => setShowDropdown(true)}
                className="bg-blue-800 py-2 w-full rounded-md shadow-md border-[1.5px] border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200"
              >
                {getActivityName(selectedActivity)}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showDropdown} onClose={() => setShowDropdown(false)}>
        <ActivityDropdown
          selectedActivity={selectedActivity}
          onSelect={(activity) => {
            setSelectedActivity(activity);
            setShowDropdown(false);
          }}
        />
      </Modal>
    </>
  );
}
