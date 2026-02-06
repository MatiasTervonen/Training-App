"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import SaveButton from "@/app/(app)/components/buttons/save-button";
import FullScreenLoader from "@/app/(app)/components/FullScreenLoader";
import Modal from "@/app/(app)/components/modal";
import TitleInput from "@/app/(app)/ui/TitleInput";
import CategoryDropdown from "../components/CategoryDropdown";
import { addActivity } from "@/app/(app)/database/activities/add-activity";
import { ActivityCategory } from "@/app/(app)/database/activities/get-categories";

export default function AddActivity() {
  const { t } = useTranslation("activities");
  const [name, setName] = useState("");
  const [met, setMet] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);

  const queryClient = useQueryClient();

  const getCategoryName = useCallback(
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
    [t]
  );

  const handleSave = async () => {
    if (!name) {
      toast.error(t("activities.addActivityScreen.errorNameRequired"));
      return;
    }

    if (!category) {
      toast.error(t("activities.addActivityScreen.errorCategoryRequired"));
      return;
    }

    const metValue = parseFloat(met);

    if (!met || met === "." || isNaN(metValue)) {
      toast.error(
        `${t("activities.addActivityScreen.errorInvalidMet")} - ${t("activities.addActivityScreen.errorInvalidMetDesc")}`
      );
      return;
    }

    if (metValue < 1 || metValue > 20) {
      toast.error(
        `${t("activities.addActivityScreen.errorMetOutOfRange")} - ${t("activities.addActivityScreen.errorMetRangeDesc")}`
      );
      return;
    }

    const finalMet = Number(metValue.toFixed(2));

    setIsSaving(true);

    const activityData = {
      name,
      base_met: finalMet,
      category_id: categoryId,
    };

    try {
      await addActivity(activityData);

      queryClient.refetchQueries({ queryKey: ["userActivities"], exact: true });

      toast.success(t("activities.addActivityScreen.successSaved"));
      setName("");
      setMet("");
      setCategory("");
      setCategoryId("");
    } catch {
      toast.error(t("activities.addActivityScreen.errorSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleMetChange = (text: string) => {
    if (/^\d*\.?\d{0,2}$/.test(text) || text === "") {
      const numValue = parseFloat(text);
      if (text === "" || text === "." || (numValue >= 0 && numValue <= 20)) {
        setMet(text);
      }
    }
  };

  return (
    <div className="page-padding min-h-full max-w-md mx-auto flex flex-col justify-between pb-10">
      <div>
        <h1 className="text-2xl mb-10 text-center">
          {t("activities.addActivityScreen.title")}
        </h1>

        <div className="mb-5">
          <TitleInput
            value={name}
            setValue={setName}
            label={t("activities.addActivityScreen.activityNameLabel")}
            placeholder={t("activities.addActivityScreen.activityNamePlaceholder")}
          />
        </div>

        <div className="mb-5">
          <TitleInput
            value={met}
            setValue={handleMetChange}
            label={t("activities.addActivityScreen.metLabel")}
            placeholder={t("activities.addActivityScreen.metPlaceholder")}
            inputMode="decimal"
          />
          <p className="text-gray-400 text-sm mt-1">
            {t("activities.addActivityScreen.metDescription")}
          </p>
        </div>

        <div className="mb-5">
          <label className="block mb-2 text-gray-300">
            {t("activities.addActivityScreen.selectCategory")}
          </label>
          <button
            onClick={() => setOpenCategoryModal(true)}
            className="w-full bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200"
          >
            {category || t("activities.addActivityScreen.selectCategory")}
          </button>
        </div>

        <Modal
          isOpen={openCategoryModal}
          onClose={() => setOpenCategoryModal(false)}
        >
          <CategoryDropdown
            onSelect={(categoryData) => {
              setCategoryId(categoryData.id);
              setCategory(getCategoryName(categoryData));
              setOpenCategoryModal(false);
            }}
          />
        </Modal>
      </div>

      <div className="mt-10">
        <SaveButton
          onClick={handleSave}
          label={t("activities.addActivityScreen.saveButton")}
        />
      </div>

      {isSaving && (
        <FullScreenLoader
          message={t("activities.addActivityScreen.savingActivity")}
        />
      )}
    </div>
  );
}
