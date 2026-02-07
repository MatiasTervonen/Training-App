"use client";

import { useState, useEffect } from "react";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import toast from "react-hot-toast";
import { editActivitySession } from "@/app/(app)/database/activities/edit-activity-session";
import { FeedItemUI } from "@/app/(app)/types/session";
import TitleInput from "@/app/(app)/ui/TitleInput";
import NotesInput from "@/app/(app)/ui/NotesInput";
import { Dot } from "lucide-react";
import {
  FullActivitySession,
  activities_with_category,
} from "@/app/(app)/types/models";
import ActivityDropdown from "@/app/(app)/activities/components/ActivityDropdown";
import { useTranslation } from "react-i18next";
import Modal from "@/app/(app)/components/modal";

type Props = {
  activity: FullActivitySession & { feed_context: "pinned" | "feed" };
  onClose: () => void;
  onSave: (updatedItem: FeedItemUI) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export default function EditActivity({ activity, onClose, onSave, onDirtyChange }: Props) {
  const { t } = useTranslation("activities");

  const [originalData] = useState({
    title: activity.session.title,
    notes: activity.session.notes,
    activityId: activity.activity?.id,
  });

  const [title, setTitle] = useState(activity.session.title || "");
  const [notes, setNotes] = useState(activity.session.notes || "");
  const [selectedActivity, setSelectedActivity] =
    useState<activities_with_category | null>(
      activity.activity as activities_with_category,
    );
  const [isSaving, setIsSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const currentData = {
    title,
    notes,
    activityId: selectedActivity?.id,
  };

  const hasChanges =
    JSON.stringify(originalData) !== JSON.stringify(currentData);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

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

  const handleSubmit = async () => {
    if (title.trim() === "") {
      toast.error(t("activities.editSession.errorEmptyTitle"));
      return;
    }

    if (!selectedActivity) {
      toast.error(t("activities.editSession.selectActivity"));
      return;
    }

    try {
      setIsSaving(true);
      const updatedFeedItem = await editActivitySession({
        id: activity.session.id,
        title,
        notes,
        activityId: selectedActivity.id,
      });

      onSave({ ...updatedFeedItem, feed_context: activity.feed_context });
      onClose();
    } catch {
      toast.error(t("activities.editSession.errorGeneric"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {hasChanges && (
        <div className="bg-slate-900 z-50 py-1 px-4 flex items-center rounded-lg fixed top-5 self-start ml-5">
          <p className="text-sm text-yellow-500">{t("common:common.unsavedChanges")}</p>
          <div className="animate-pulse">
            <Dot color="#eab308" />
          </div>
        </div>
      )}

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
                className="bg-blue-800 py-2 w-full rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200"
              >
                {getActivityName(selectedActivity)}
              </button>
            </div>
          </div>
          <div className="w-full">
            <SaveButton onClick={handleSubmit} />
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

      {isSaving && (
        <FullScreenLoader message={t("activities.editSession.savingSession")} />
      )}
    </>
  );
}
