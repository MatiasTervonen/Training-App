"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type MealTypePickerProps = {
  selected: string;
  onSelect: (type: string) => void;
  customTypes: string[];
};

const DEFAULT_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function MealTypePicker({
  selected,
  onSelect,
  customTypes,
}: MealTypePickerProps) {
  const { t } = useTranslation("nutrition");

  const rows = useMemo(() => {
    const allTypes = [
      ...DEFAULT_TYPES.map((type) => ({
        value: type,
        label: t(`meals.${type}`),
      })),
      ...customTypes.map((type) => ({
        value: type,
        label: type,
      })),
    ];

    // Split into rows of 2
    const result: (typeof allTypes)[] = [];
    for (let i = 0; i < allTypes.length; i += 2) {
      result.push(allTypes.slice(i, i + 2));
    }
    return result;
  }, [customTypes, t]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">{t("detail.mealType")}</span>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2">
          {row.map((type) => {
            const isSelected = selected === type.value;
            return (
              <button
                key={type.value}
                onClick={() => onSelect(type.value)}
                className={`flex-1 text-center py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-fuchsia-500/20 border-fuchsia-500/50"
                    : "bg-slate-800 border-slate-700 hover:bg-slate-700/50"
                }`}
              >
                {type.label}
              </button>
            );
          })}
          {row.length === 1 && <div className="flex-1" />}
        </div>
      ))}
    </div>
  );
}
