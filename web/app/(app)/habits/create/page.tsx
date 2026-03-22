"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useSaveHabit } from "@/features/habits/hooks/useSaveHabit";
import { useHabits } from "@/features/habits/hooks/useHabits";
import HabitForm from "@/features/habits/components/HabitForm";
import toast from "react-hot-toast";

export default function CreateHabitPage() {
  const { t } = useTranslation("habits");
  const router = useRouter();
  const { mutate: saveHabit, isPending } = useSaveHabit();
  const { data: habits } = useHabits();

  const handleSave = (values: {
    name: string;
    type: "manual" | "duration";
    targetValue: number | null;
    frequencyDays: number[] | null;
    alarmType: "normal" | "priority";
  }) => {
    const sortOrder = (habits?.length ?? 0) + 1;

    saveHabit(
      {
        name: values.name,
        type: values.type,
        targetValue: values.targetValue,
        frequencyDays: values.frequencyDays,
        alarmType: values.alarmType,
        reminderTime: null,
        sortOrder,
      },
      {
        onSuccess: () => {
          toast.success(t("habits.saved"));
          router.push("/habits");
        },
        onError: () => {
          toast.error(t("habits.errorSaving"));
        },
      },
    );
  };

  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-8 text-2xl">{t("habits.addHabit")}</h1>
      <HabitForm onSave={handleSave} isSaving={isPending} />
    </div>
  );
}
