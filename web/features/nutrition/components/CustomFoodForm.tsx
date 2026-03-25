"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import CustomInput from "@/ui/CustomInput";
import { useSaveCustomFood } from "@/features/nutrition/hooks/useSaveCustomFood";

type CustomFoodFormProps = {
  onSaved?: () => void;
};

const SODIUM_TO_SALT = 2.5;
const SALT_TO_SODIUM = 1 / SODIUM_TO_SALT;

export default function CustomFoodForm({ onSaved }: CustomFoodFormProps) {
  const { t } = useTranslation("nutrition");
  const { handleSave: saveFood, isSaving } = useSaveCustomFood();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingSize, setServingSize] = useState("100");
  const [servingDescription, setServingDescription] = useState("");
  const [caloriesPer100g, setCaloriesPer100g] = useState("");
  const [proteinPer100g, setProteinPer100g] = useState("");
  const [carbsPer100g, setCarbsPer100g] = useState("");
  const [fatPer100g, setFatPer100g] = useState("");
  const [saturatedFatPer100g, setSaturatedFatPer100g] = useState("");
  const [sugarPer100g, setSugarPer100g] = useState("");
  const [fiberPer100g, setFiberPer100g] = useState("");
  const [sodiumPer100gMg, setSodiumPer100gMg] = useState("");
  const [saltPer100g, setSaltPer100g] = useState("");

  const handleSodiumChange = (value: string) => {
    setSodiumPer100gMg(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setSaltPer100g(String(Math.round(num * SODIUM_TO_SALT) / 1000));
    } else {
      setSaltPer100g("");
    }
  };

  const handleSaltChange = (value: string) => {
    setSaltPer100g(value);
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setSodiumPer100gMg(String(Math.round(num * SALT_TO_SODIUM * 1000 * 10) / 10));
    } else {
      setSodiumPer100gMg("");
    }
  };

  const handleSave = async () => {
    const cals = parseFloat(caloriesPer100g);
    if (isNaN(cals) || cals < 0) return;

    const sodiumMg = parseFloat(sodiumPer100gMg);
    const sodiumG = !isNaN(sodiumMg) ? sodiumMg / 1000 : null;

    const success = await saveFood({
      name: name.trim(),
      brand: brand.trim() || null,
      servingSizeG: parseFloat(servingSize) || 100,
      servingDescription: servingDescription.trim() || null,
      caloriesPer100g: cals,
      proteinPer100g: parseFloat(proteinPer100g) || 0,
      carbsPer100g: parseFloat(carbsPer100g) || 0,
      fatPer100g: parseFloat(fatPer100g) || 0,
      saturatedFatPer100g: parseFloat(saturatedFatPer100g) || null,
      sugarPer100g: parseFloat(sugarPer100g) || null,
      fiberPer100g: parseFloat(fiberPer100g) || null,
      sodiumPer100g: sodiumG,
    });

    if (success) {
      setName("");
      setBrand("");
      setServingSize("100");
      setServingDescription("");
      setCaloriesPer100g("");
      setProteinPer100g("");
      setCarbsPer100g("");
      setFatPer100g("");
      setSaturatedFatPer100g("");
      setSugarPer100g("");
      setFiberPer100g("");
      setSodiumPer100gMg("");
      setSaltPer100g("");
      onSaved?.();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-base">{t("custom.title")}</p>

      {/* Basic info */}
      <CustomInput
        label={t("custom.name")}
        value={name}
        setValue={setName}
        placeholder={t("custom.namePlaceholder")}
      />
      <CustomInput
        label={t("custom.brand")}
        value={brand}
        setValue={setBrand}
        placeholder={t("custom.brandPlaceholder")}
      />

      {/* Serving info */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <CustomInput
          label={t("custom.servingSize")}
          value={servingSize}
          setValue={setServingSize}
          type="number"
          inputMode="decimal"
          min="0"
        />
        <CustomInput
          label={t("custom.servingDescription")}
          value={servingDescription}
          setValue={setServingDescription}
          placeholder={t("custom.servingDescPlaceholder")}
        />
      </div>

      {/* Main macros */}
      <p className="text-sm mt-2">{t("custom.per100g")}</p>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <CustomInput
          label={t("custom.calories")}
          value={caloriesPer100g}
          setValue={setCaloriesPer100g}
          type="number"
          inputMode="decimal"
          min="0"
        />
        <CustomInput
          label={t("custom.protein")}
          value={proteinPer100g}
          setValue={setProteinPer100g}
          type="number"
          inputMode="decimal"
          min="0"
        />
        <CustomInput
          label={t("custom.carbs")}
          value={carbsPer100g}
          setValue={setCarbsPer100g}
          type="number"
          inputMode="decimal"
          min="0"
        />
        <CustomInput
          label={t("custom.fat")}
          value={fatPer100g}
          setValue={setFatPer100g}
          type="number"
          inputMode="decimal"
          min="0"
        />
      </div>

      {/* Optional nutrients */}
      <p className="text-sm mt-2">{t("custom.optional")}</p>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <CustomInput
          label={t("custom.saturatedFat")}
          value={saturatedFatPer100g}
          setValue={setSaturatedFatPer100g}
          type="number"
          inputMode="decimal"
          min="0"
        />
        <CustomInput
          label={t("custom.sugar")}
          value={sugarPer100g}
          setValue={setSugarPer100g}
          type="number"
          inputMode="decimal"
          min="0"
        />
        <CustomInput
          label={t("custom.fiber")}
          value={fiberPer100g}
          setValue={setFiberPer100g}
          type="number"
          inputMode="decimal"
          min="0"
        />
        <CustomInput
          label={`${t("custom.sodium")} (mg)`}
          value={sodiumPer100gMg}
          setValue={handleSodiumChange}
          type="number"
          inputMode="decimal"
          min="0"
        />
        <CustomInput
          label={`${t("custom.salt")} (g)`}
          value={saltPer100g}
          setValue={handleSaltChange}
          type="number"
          inputMode="decimal"
          min="0"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="btn-save w-full mt-2"
      >
        {isSaving ? t("custom.saving") : t("custom.save")}
      </button>
    </div>
  );
}
