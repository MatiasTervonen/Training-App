"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import Modal from "@/app/(app)/components/modal";
import TitleInput from "@/app/(app)/ui/TitleInput";
import SubNotesInput from "@/app/(app)/ui/SubNotesInput";
import ActivityDropdown from "@/app/(app)/activities/components/ActivityDropdown";
import { editTemplate } from "@/app/(app)/database/activities/edit-template";
import { templateSummary, activities_with_category } from "@/app/(app)/types/models";

export default function EditTemplatePage() {
  const { t } = useTranslation("activities");
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const queryClient = useQueryClient();

  const template = queryClient
    .getQueryData<templateSummary[]>(["get-activity-templates"])
    ?.find((t) => t.template.id === templateId);

  const [name, setName] = useState(template?.template.name || "");
  const [notes, setNotes] = useState(template?.template.notes || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<activities_with_category | null>(
      template
        ? ({
            id: template.activity.id,
            name: template.activity.name,
            slug: template.activity.slug,
          } as activities_with_category)
        : null
    );

  const getActivityName = useCallback(
    (activity: activities_with_category | null) => {
      if (!activity) return t("activities.editTemplateScreen.selectActivity");
      if (activity.slug) {
        const translated = t(`activities.activityNames.${activity.slug}`, {
          defaultValue: "",
        });
        if (
          translated &&
          translated !== `activities.activityNames.${activity.slug}`
        ) {
          return translated;
        }
      }
      return activity.name;
    },
    [t]
  );

  const handleSave = async () => {
    if (!templateId) return;

    if (name.trim() === "") {
      toast.error(
        `${t("activities.editTemplateScreen.errorTitle")} - ${t("activities.editTemplateScreen.errorEmptyName")}`
      );
      return;
    }

    if (!selectedActivity) {
      toast.error(t("activities.editTemplateScreen.selectActivity"));
      return;
    }

    try {
      setIsLoading(true);
      await editTemplate({
        id: templateId,
        name,
        notes,
        activityId: selectedActivity.id,
      });

      queryClient.refetchQueries({
        queryKey: ["get-activity-templates"],
        exact: true,
      });

      toast.success(t("activities.editTemplateScreen.successMessage"));
      router.push("/activities/templates");
    } catch (error) {
      console.error("Error saving template", error);
      toast.error(
        `${t("activities.editTemplateScreen.errorTitle")} - ${t("activities.editTemplateScreen.errorGeneric")}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!template) {
    return (
      <div className="page-padding min-h-full max-w-md mx-auto">
        <h1 className="text-2xl text-center mb-10">
          {t("activities.editTemplateScreen.title")}
        </h1>
        <p className="text-center text-red-500 mt-20">
          {t("activities.editTemplateScreen.templateNotFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="page-padding min-h-full max-w-md mx-auto flex flex-col justify-between pb-10">
      <div>
        <h1 className="text-2xl text-center mb-10">
          {t("activities.editTemplateScreen.title")}
        </h1>

        <div className="mb-5">
          <TitleInput
            value={name}
            setValue={setName}
            label={t("activities.editTemplateScreen.templateNameLabel")}
            placeholder={t("activities.editTemplateScreen.templateNamePlaceholder")}
          />
        </div>

        <div className="mb-5">
          <SubNotesInput
            notes={notes}
            setNotes={setNotes}
            label={t("activities.editTemplateScreen.templateNotesLabel")}
            placeholder={t("activities.editTemplateScreen.templateNotesPlaceholder")}
          />
        </div>

        <div className="mt-5">
          <label className="block mb-2 text-gray-300 text-sm">
            {t("activities.editTemplateScreen.selectActivity")}
          </label>
          <button
            onClick={() => setShowDropdown(true)}
            className="w-full bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-gray-100 text-center hover:bg-blue-700 cursor-pointer hover:scale-105 transition-all duration-200"
          >
            {getActivityName(selectedActivity)}
          </button>
        </div>

        <Modal isOpen={showDropdown} onClose={() => setShowDropdown(false)}>
          <ActivityDropdown
            onSelect={(activity) => {
              setSelectedActivity(activity);
              setShowDropdown(false);
            }}
            selectedActivity={selectedActivity}
          />
        </Modal>
      </div>

      <div className="gap-5 flex flex-col mt-10">
        <SaveButton
          onClick={handleSave}
          label={t("activities.editTemplateScreen.saveButton")}
        />
        <button
          onClick={() => router.push("/activities/templates")}
          className="w-full bg-gray-700 py-3 rounded-md shadow-md border-2 border-gray-500 text-gray-100 text-center hover:bg-gray-600 cursor-pointer hover:scale-105 transition-all duration-200"
        >
          {t("activities.editTemplateScreen.cancelButton")}
        </button>
      </div>

      {isLoading && (
        <FullScreenLoader
          message={t("activities.editTemplateScreen.savingTemplate")}
        />
      )}
    </div>
  );
}
