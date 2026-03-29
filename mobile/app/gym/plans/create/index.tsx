import { useState, useMemo } from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AppInput from "@/components/AppInput";
import AnimatedButton from "@/components/buttons/animatedButton";
import Toggle from "@/components/toggle";
import FullScreenLoader from "@/components/FullScreenLoader";
import ExerciseHistoryModal from "@/features/gym/components/ExerciseHistoryModal";
import PlanDaysEditor from "@/features/gym/plans/components/PlanDaysEditor";
import PlanTargetsEditor from "@/features/gym/plans/components/PlanTargetsEditor";
import usePlanForm from "@/features/gym/plans/hooks/usePlanForm";
import useSavePlan from "@/features/gym/plans/hooks/useSavePlan";
import useSavePlanDraft, { clearPlanDraft } from "@/features/gym/plans/hooks/useSavePlanDraft";
import Toast from "react-native-toast-message";

export default function CreatePlanPage() {
  const { t } = useTranslation(["gym", "common"]);
  const { draftId: draftIdParam } = useLocalSearchParams<{ draftId?: string }>();
  const draftId = useMemo(() => draftIdParam || Date.now().toString(), [draftIdParam]);

  // Step state
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Plan setup
  const [name, setName] = useState("");
  const [totalWeeks, setTotalWeeks] = useState<number | null>(4);
  const [noEndDate, setNoEndDate] = useState(false);
  const [weeksInput, setWeeksInput] = useState("4");

  // Saving
  const [isSaving, setIsSaving] = useState(false);

  const form = usePlanForm({ noEndDate, totalWeeks });

  const { isLoaded: draftLoaded } = useSavePlanDraft({
    draftId,
    name,
    totalWeeks,
    noEndDate,
    weeksInput,
    days: form.days,
    targets: form.targets,
    step,
    setIdCounterRef: form.setIdCounter,
    setName,
    setTotalWeeks,
    setNoEndDate,
    setWeeksInput,
    setDays: form.setDays,
    setTargets: form.setTargets,
    setStep,
    onDraftLoaded: (loadedDays) => {
      form.setCollapsedDays(new Set(loadedDays.map((d) => d.position)));
    },
  });

  const { handleSavePlan } = useSavePlan({
    name,
    totalWeeks: noEndDate ? null : totalWeeks,
    days: form.buildDaysForSave(),
    targets: form.buildFlatTargets(),
    setIsSaving,
    onSuccess: () => clearPlanDraft(draftId),
  });

  // ==================
  // Navigation
  // ==================

  const handleNext = () => {
    if (step === 1) {
      if (name.trim() === "") {
        Toast.show({ type: "error", text1: t("gym:gym.plans.planName"), text2: t("common:common.required") });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (form.days.length === 0 || form.days.every((d) => d.exercises.length === 0)) {
        Toast.show({ type: "error", text1: t("gym:gym.plans.atLeastOneExercise") });
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    if (name.trim() === "" || form.days.length === 0) return;
    await handleSavePlan();
  };

  if (isSaving || (draftIdParam && !draftLoaded)) {
    return <FullScreenLoader visible message={isSaving ? t("gym:gym.plans.saving") : t("gym:gym.plans.loading")} />;
  }

  const stepLabels = [
    t("gym:gym.plans.setupPlan"),
    t("gym:gym.plans.addDaysStep"),
    t("gym:gym.plans.addTargetsStep"),
  ];

  return (
    <View className="flex-1">
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      <View className="w-full px-5 pt-5 pb-4">
        <View className="max-w-md mx-auto w-full">
          <AppText className="text-center mb-3 text-2xl">
            {t("gym:gym.plans.create")}
          </AppText>

          {/* Step indicator */}
          <BodyText className="text-center mb-8 text-sm">
            {t("gym:gym.plans.step", { current: step, total: totalSteps })} — {stepLabels[step - 1]}
          </BodyText>

          {/* ======================== Step 1: Setup ======================== */}
          {step === 1 && (
            <View className="gap-7">
              <AppInput
                value={name}
                setValue={setName}
                label={t("gym:gym.plans.planName")}
                placeholder={t("gym:gym.plans.planNamePlaceholder")}
              />

              <View className="flex-row items-center justify-between">
                <AppText>{t("gym:gym.plans.noEndDate")}</AppText>
                <Toggle isOn={noEndDate} onToggle={() => {
                  const newValue = !noEndDate;
                  setNoEndDate(newValue);
                  if (newValue) {
                    setTotalWeeks(null);
                  } else {
                    const w = parseInt(weeksInput, 10);
                    setTotalWeeks(isNaN(w) ? 4 : w);
                  }
                }} />
              </View>

              {!noEndDate && (
                <AppInput
                  value={weeksInput}
                  setValue={(value) => {
                    setWeeksInput(value);
                    const parsed = parseInt(value, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      setTotalWeeks(parsed);
                    }
                  }}
                  label={t("gym:gym.plans.totalWeeks")}
                  keyboardType="numeric"
                  placeholder="4"
                />
              )}
            </View>
          )}

          {/* ======================== Step 2: Days + Exercises ======================== */}
          {step === 2 && <PlanDaysEditor form={form} />}

          {/* ======================== Step 3: Targets ======================== */}
          {step === 3 && <PlanTargetsEditor form={form} noEndDate={noEndDate} />}

        </View>
      </View>
    </ScrollView>

    {/* Navigation buttons — fixed at bottom */}
    <View className="flex-row gap-3 px-5 py-3 border-t border-slate-700">
      {step > 1 && (
        <AnimatedButton onPress={handleBack} className="flex-1 btn-neutral">
          <AppText className="text-center" numberOfLines={1}>
            {t("gym:gym.plans.back")}
          </AppText>
        </AnimatedButton>
      )}
      {step < totalSteps ? (
        <AnimatedButton onPress={handleNext} className="flex-1 btn-base">
          <AppText className="text-center" numberOfLines={1}>
            {t("gym:gym.plans.next")}
          </AppText>
        </AnimatedButton>
      ) : (
        <AnimatedButton onPress={handleSave} className="flex-1 btn-save">
          <AppText className="text-center" numberOfLines={1}>
            {t("gym:gym.plans.save")}
          </AppText>
        </AnimatedButton>
      )}
    </View>

    <ExerciseHistoryModal
      isOpen={!!form.historyExerciseId}
      onClose={() => form.setHistoryExerciseId(null)}
      isLoading={form.historyLoading}
      history={form.historyData}
      error={form.historyError ? String(form.historyError) : null}
    />
    </View>
  );
}
