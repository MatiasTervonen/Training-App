"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import SaveButton from "@/components/buttons/save-button";
import FullScreenLoader from "@/components/FullScreenLoader";
import Modal from "@/components/modal";
import TitleInput from "@/ui/TitleInput";
import CategoryDropdown from "@/features/activities/components/CategoryDropdown";
import UserActivityDropdownEdit from "@/features/activities/components/UserActivityDropdownEdit";
import { editActivity } from "@/database/activities/edit-activity";
import { deleteActivity } from "@/database/activities/delete-activity";
import { UserActivity } from "@/database/activities/get-user-activities";
import { ActivityCategory } from "@/database/activities/get-categories";

export default function EditActivity() {
  const { t } = useTranslation("activities");
  const [name, setName] = useState("");
  const [met, setMet] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(
    null,
  );
  const [openCategoryModal, setOpenCategoryModal] = useState(false);

  const queryClient = useQueryClient();

  const getCategoryName = useCallback(
    (slug: string | null | undefined, fallbackName: string) => {
      if (slug) {
        const translated = t(`activities.categories.${slug}`, {
          defaultValue: "",
        });
        if (translated && translated !== `activities.categories.${slug}`) {
          return translated;
        }
      }
      return fallbackName;
    },
    [t],
  );

  const getCategoryNameFromData = useCallback(
    (categoryData: ActivityCategory) => {
      if (categoryData.slug) {
        const translated = t(`activities.categories.${categoryData.slug}`, {
          defaultValue: "",
        });
        if (
          translated &&
          translated !== `activities.categories.${categoryData.slug}`
        ) {
          return translated;
        }
      }
      return categoryData.name;
    },
    [t],
  );

  const handleSave = async () => {
    if (!name) {
      toast.error(t("activities.editActivityScreen.errorNameRequired"));
      return;
    }

    if (!category) {
      toast.error(t("activities.editActivityScreen.errorCategoryRequired"));
      return;
    }

    const metValue = parseFloat(met);

    if (!met || met === "." || isNaN(metValue)) {
      toast.error(
        `${t("activities.editActivityScreen.errorInvalidMet")} - ${t("activities.editActivityScreen.errorInvalidMetDesc")}`,
      );
      return;
    }

    if (metValue < 1 || metValue > 20) {
      toast.error(
        `${t("activities.editActivityScreen.errorMetOutOfRange")} - ${t("activities.editActivityScreen.errorMetRangeDesc")}`,
      );
      return;
    }

    const finalMet = Number(metValue.toFixed(2));

    setIsSaving(true);

    const activityData = {
      name,
      base_met: finalMet,
      category_id: categoryId,
      id: selectedActivity!.id,
    };

    try {
      await editActivity(activityData);

      queryClient.refetchQueries({ queryKey: ["userActivities"], exact: true });
      toast.success(t("activities.editActivityScreen.successEdited"));
      resetFields();
    } catch {
      toast.error(t("activities.editActivityScreen.errorEditFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    setIsDeleting(true);
    setIsSaving(true);

    try {
      await deleteActivity(activityId);

      await queryClient.refetchQueries({
        queryKey: ["userActivities"],
        exact: true,
      });
      toast.success(t("activities.editActivityScreen.successDeleted"));
      setSelectedActivity(null);
    } catch {
      toast.error(t("activities.editActivityScreen.errorDeleteFailed"));
    } finally {
      setIsDeleting(false);
      setIsSaving(false);
    }
  };

  const resetFields = () => {
    setName("");
    setMet("");
    setCategory("");
    setCategoryId("");
    setSelectedActivity(null);
  };

  const handleMetChange = (text: string) => {
    if (/^\d*\.?\d{0,2}$/.test(text) || text === "") {
      const numValue = parseFloat(text);
      if (text === "" || text === "." || (numValue >= 0 && numValue <= 20)) {
        setMet(text);
      }
    }
  };

  if (!selectedActivity) {
    return (
      <div className="page-padding h-full max-w-2xl mx-auto">
        <UserActivityDropdownEdit
          onSelect={(activity) => {
            setSelectedActivity(activity);
            setName(activity.name);
            setMet(activity.base_met?.toString() ?? "");
            setCategoryId(activity.category_id ?? "");
            setCategory(
              getCategoryName(
                activity.activity_categories?.slug,
                activity.activity_categories?.name ?? "",
              ),
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-padding min-h-full max-w-md mx-auto flex flex-col justify-between pb-10">
      <div>
        <h1 className="text-2xl mb-10 text-center">
          {t("activities.editActivityScreen.title")}
        </h1>

        <div className="mb-5">
          <TitleInput
            value={name}
            setValue={setName}
            label={t("activities.editActivityScreen.activityNameLabel")}
            placeholder={t(
              "activities.editActivityScreen.activityNamePlaceholder",
            )}
          />
        </div>

        <div className="mb-5">
          <TitleInput
            value={met}
            setValue={handleMetChange}
            label={t("activities.editActivityScreen.metLabel")}
            placeholder={t("activities.editActivityScreen.metPlaceholder")}
            inputMode="decimal"
          />
          <p className="text-gray-400 text-sm mt-1">
            {t("activities.editActivityScreen.metDescription")}
          </p>
        </div>

        <div className="mb-5">
          <button
            onClick={() => setOpenCategoryModal(true)}
            className="w-full bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200"
          >
            {category || t("activities.editActivityScreen.selectCategory")}
          </button>
        </div>

        <Modal
          isOpen={openCategoryModal}
          onClose={() => setOpenCategoryModal(false)}
        >
          <CategoryDropdown
            onSelect={(categoryData) => {
              setCategoryId(categoryData.id);
              setCategory(getCategoryNameFromData(categoryData));
              setOpenCategoryModal(false);
            }}
          />
        </Modal>
      </div>

      <div className="mt-20 flex flex-col gap-5">
        <SaveButton
          onClick={handleSave}
          label={t("activities.editActivityScreen.updateButton")}
        />
        <button
          onClick={() => handleDeleteActivity(selectedActivity!.id)}
          className="w-full bg-red-800 py-3 rounded-md shadow-md border-2 border-red-500 text-gray-100 text-center hover:bg-red-700 cursor-pointer hover:scale-105 transition-all duration-200"
        >
          {t("activities.editActivityScreen.deleteButton")}
        </button>
        <button
          onClick={resetFields}
          className="w-full bg-gray-700 py-3 rounded-md shadow-md border-2 border-gray-500 text-gray-100 text-center hover:bg-gray-600 cursor-pointer hover:scale-105 transition-all duration-200"
        >
          {t("activities.editActivityScreen.cancelButton")}
        </button>
      </div>

      {isSaving && (
        <FullScreenLoader
          message={
            isDeleting
              ? t("activities.editActivityScreen.deletingActivity")
              : t("activities.editActivityScreen.savingActivity")
          }
        />
      )}
    </div>
  );
}
