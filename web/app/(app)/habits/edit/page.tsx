"use client";

import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useEditHabit } from "@/features/habits/hooks/useEditHabit";
import HabitForm from "@/features/habits/components/HabitForm";
import type { HabitFormValues } from "@/features/habits/components/HabitForm";
import Spinner from "@/components/spinner";

export default function EditHabitPage() {
  const { t } = useTranslation("habits");
  const searchParams = useSearchParams();
  const habitId = searchParams.get("id");

  const { data: habits, isLoading } = useHabits();
  const { mutateAsync: editHabit } = useEditHabit();

  const habit = habits?.find((h) => h.id === habitId);

  const handleAutoSave = async (values: HabitFormValues) => {
    if (!habitId) return;
    await editHabit({
      habitId,
      name: values.name,
      targetValue: values.targetValue,
      frequencyDays: values.frequencyDays,
      alarmType: values.alarmType,
      reminderTime: null,
    });
  };

  if (isLoading) {
    return (
      <div className="page-padding min-h-full max-w-md mx-auto flex justify-center pt-20">
        <Spinner />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="page-padding min-h-full max-w-md mx-auto">
        <p className="text-center font-body text-slate-400 mt-20">{t("habits.noHabits")}</p>
      </div>
    );
  }

  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-8 text-2xl">{t("habits.editHabit")}</h1>
      <HabitForm
        initialValues={habit}
        onSave={() => {}}
        onAutoSave={handleAutoSave}
        isSaving={false}
      />
    </div>
  );
}
