"use client";

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import FullScreenLoader from "@/components/FullScreenLoader";
import Modal from "@/components/modal";
import TitleInput from "@/ui/TitleInput";
import CategoryDropdown from "@/features/activities/components/CategoryDropdown";
import UserActivityDropdownEdit from "@/features/activities/components/UserActivityDropdownEdit";
import { editActivity } from "@/database/activities/edit-activity";
import { deleteActivity } from "@/database/activities/delete-activity";
import { UserActivity } from "@/database/activities/get-user-activities";
import { ActivityCategory } from "@/database/activities/get-categories";
import { useAutoSave } from "@/hooks/useAutoSave";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";

export default function EditActivity() {
  const { t } = useTranslation("activities");
  const [name, setName] = useState("");
  const [met, setMet] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
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

  const selectedActivityRef = useRef(selectedActivity);
  selectedActivityRef.current = selectedActivity;

  const handleAutoSave = useCallback(
    async (data: { name: string; met: string; categoryId: string }) => {
      if (!data.name) throw new Error("Name required");
      if (!data.categoryId) throw new Error("Category required");

      const metValue = parseFloat(data.met);
      if (!data.met || data.met === "." || isNaN(metValue)) throw new Error("Invalid MET");
      if (metValue < 1 || metValue > 20) throw new Error("MET out of range");

      const finalMet = Number(metValue.toFixed(2));
      const current = selectedActivityRef.current;
      if (!current) return;

      await editActivity({
        name: data.name,
        base_met: finalMet,
        category_id: data.categoryId,
        id: current.id,
      });

      queryClient.refetchQueries({ queryKey: ["userActivities"], exact: true });
    },
    [queryClient],
  );

  const { status } = useAutoSave({
    data: { name, met, categoryId },
    onSave: handleAutoSave,
    enabled: !!selectedActivity,
  });

  const handleDeleteActivity = async (activityId: string) => {
    setIsDeleting(true);

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
            className="w-full bg-blue-800 py-2 rounded-md shadow-md border-[1.5px] border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200"
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

      <AutoSaveIndicator status={status} />

      <div className="mt-20 flex flex-col gap-5">
        <button
          onClick={() => handleDeleteActivity(selectedActivity!.id)}
          className="w-full bg-red-800 py-3 rounded-md shadow-md border-[1.5px] border-red-500 text-gray-100 text-center hover:bg-red-700 cursor-pointer hover:scale-105 transition-all duration-200"
        >
          {t("activities.editActivityScreen.deleteButton")}
        </button>
        <button
          onClick={resetFields}
          className="w-full bg-gray-700 py-3 rounded-md shadow-md border-[1.5px] border-gray-500 text-gray-100 text-center hover:bg-gray-600 cursor-pointer hover:scale-105 transition-all duration-200"
        >
          {t("activities.editActivityScreen.cancelButton")}
        </button>
      </div>

      {isDeleting && (
        <FullScreenLoader
          message={t("activities.editActivityScreen.deletingActivity")}
        />
      )}
    </div>
  );
}
