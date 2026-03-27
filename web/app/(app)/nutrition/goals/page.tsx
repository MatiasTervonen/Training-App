"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import CustomInput from "@/ui/CustomInput";
import Spinner from "@/components/spinner";
import { useNutritionGoals } from "@/features/nutrition/hooks/useNutritionGoals";
import { useSaveGoals } from "@/features/nutrition/hooks/useSaveGoals";

const OPTIONAL_NUTRIENTS = [
  "fiber",
  "sugar",
  "sodium",
  "saturated_fat",
] as const;

export default function NutritionGoalsPage() {
  const { t } = useTranslation("nutrition");
  const { t: tCommon } = useTranslation();
  const { data: goals, isLoading } = useNutritionGoals();
  const { handleSave, isSaving } = useSaveGoals();

  const [calorieGoal, setCalorieGoal] = useState("2000");
  const [proteinGoal, setProteinGoal] = useState("");
  const [carbsGoal, setCarbsGoal] = useState("");
  const [fatGoal, setFatGoal] = useState("");
  const [fiberGoal, setFiberGoal] = useState("");
  const [sugarGoal, setSugarGoal] = useState("");
  const [sodiumGoal, setSodiumGoal] = useState("");
  const [saturatedFatGoal, setSaturatedFatGoal] = useState("");
  const [visibleNutrients, setVisibleNutrients] = useState<string[]>([]);
  const [customMealTypes, setCustomMealTypes] = useState<string[]>([]);
  const [newMealType, setNewMealType] = useState("");

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (goals && !hasInitialized.current) {
      hasInitialized.current = true;
      setCalorieGoal(String(goals.calorie_goal ?? 2000));
      setProteinGoal(goals.protein_goal ? String(goals.protein_goal) : "");
      setCarbsGoal(goals.carbs_goal ? String(goals.carbs_goal) : "");
      setFatGoal(goals.fat_goal ? String(goals.fat_goal) : "");
      setFiberGoal(goals.fiber_goal ? String(goals.fiber_goal) : "");
      setSugarGoal(goals.sugar_goal ? String(goals.sugar_goal) : "");
      setSodiumGoal(goals.sodium_goal ? String(goals.sodium_goal) : "");
      setSaturatedFatGoal(
        goals.saturated_fat_goal ? String(goals.saturated_fat_goal) : "",
      );
      setVisibleNutrients(goals.visible_nutrients ?? []);
      setCustomMealTypes(goals.custom_meal_types ?? []);
    }
  }, [goals]);

  const toggleNutrient = (key: string) => {
    setVisibleNutrients((prev) =>
      prev.includes(key) ? prev.filter((n) => n !== key) : [...prev, key],
    );
  };

  const addMealType = () => {
    const trimmed = newMealType.trim();
    if (!trimmed) return;
    if (customMealTypes.includes(trimmed)) return;
    setCustomMealTypes([...customMealTypes, trimmed]);
    setNewMealType("");
  };

  const removeMealType = (index: number) => {
    setCustomMealTypes(customMealTypes.filter((_, i) => i !== index));
  };

  const onSave = () => {
    handleSave({
      calorieGoal: Number(calorieGoal) || 2000,
      proteinGoal: proteinGoal ? Number(proteinGoal) : null,
      carbsGoal: carbsGoal ? Number(carbsGoal) : null,
      fatGoal: fatGoal ? Number(fatGoal) : null,
      fiberGoal: fiberGoal ? Number(fiberGoal) : null,
      sugarGoal: sugarGoal ? Number(sugarGoal) : null,
      sodiumGoal: sodiumGoal ? Number(sodiumGoal) : null,
      saturatedFatGoal: saturatedFatGoal ? Number(saturatedFatGoal) : null,
      visibleNutrients,
      customMealTypes,
    });
  };

  if (isLoading) {
    return (
      <div className="page-padding flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page-padding flex flex-col min-h-full">
      <div className="max-w-xl mx-auto w-full flex-1">
        <p className="text-xl text-center mb-6">{t("goals.title")}</p>

        {/* Calorie goal */}
        <div className="mb-5">
          <CustomInput
            label={t("goals.calorieGoal")}
            value={calorieGoal}
            setValue={setCalorieGoal}
            type="number"
            inputMode="numeric"
            placeholder="2000"
          />
        </div>

        {/* Protein goal */}
        <div className="mb-5">
          <CustomInput
            label={t("goals.proteinGoal")}
            value={proteinGoal}
            setValue={setProteinGoal}
            type="number"
            inputMode="decimal"
            placeholder={t("goals.noGoal")}
          />
        </div>

        {/* Carbs goal */}
        <div className="mb-5">
          <CustomInput
            label={t("goals.carbsGoal")}
            value={carbsGoal}
            setValue={setCarbsGoal}
            type="number"
            inputMode="decimal"
            placeholder={t("goals.noGoal")}
          />
        </div>

        {/* Fat goal */}
        <div className="mb-5">
          <CustomInput
            label={t("goals.fatGoal")}
            value={fatGoal}
            setValue={setFatGoal}
            type="number"
            inputMode="decimal"
            placeholder={t("goals.noGoal")}
          />
        </div>

        {/* Optional nutrients toggles */}
        <div className="mb-6">
          <p className="text-sm mb-3">{t("goals.optionalNutrients")}</p>
          <p className="font-body text-xs mb-3 text-slate-400">
            {t("goals.optionalNutrientsDesc")}
          </p>

          {OPTIONAL_NUTRIENTS.map((key) => {
            const enabled = visibleNutrients.includes(key);
            const goalValue =
              key === "fiber"
                ? fiberGoal
                : key === "sugar"
                  ? sugarGoal
                  : key === "sodium"
                    ? sodiumGoal
                    : saturatedFatGoal;
            const setGoalValue =
              key === "fiber"
                ? setFiberGoal
                : key === "sugar"
                  ? setSugarGoal
                  : key === "sodium"
                    ? setSodiumGoal
                    : setSaturatedFatGoal;

            return (
              <div key={key} className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">
                    {t(`goals.${key}Toggle` as "goals.fiberToggle")}
                  </span>
                  <button
                    onClick={() => toggleNutrient(key)}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${
                      enabled ? "bg-fuchsia-500" : "bg-slate-600"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        enabled ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                {enabled && (
                  <CustomInput
                    value={goalValue}
                    setValue={setGoalValue}
                    type="number"
                    inputMode="decimal"
                    placeholder={t("goals.noGoal")}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Custom meal types */}
        <div className="mb-6">
          <p className="text-sm mb-3">{t("goals.customMeals")}</p>

          {customMealTypes.map((type, index) => (
            <div
              key={type}
              className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3 mb-2"
            >
              <span className="font-body text-sm">{type}</span>
              <button
                onClick={() => removeMealType(index)}
                className="p-1 cursor-pointer hover:bg-slate-700/50 rounded transition-colors"
              >
                <X size={16} className="text-red-500" />
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <div className="flex-1">
              <CustomInput
                value={newMealType}
                setValue={setNewMealType}
                placeholder={t("goals.mealTypePlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addMealType();
                }}
              />
            </div>
            <button
              onClick={addMealType}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
            >
              <Plus size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Save button */}
      <div className="max-w-xl mx-auto w-full pt-4 pb-4">
        <button
          onClick={onSave}
          className="btn-save w-full py-3 cursor-pointer"
          disabled={isSaving}
        >
          {isSaving ? tCommon("common.saving") : tCommon("common.save")}
        </button>
      </div>
    </div>
  );
}
