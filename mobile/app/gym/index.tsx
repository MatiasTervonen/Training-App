import { View, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import { useTimerStore } from "@/lib/stores/timerStore";
import Toast from "react-native-toast-message";
import { List, ChartNoAxesCombined, Settings, ClipboardList } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { SESSION_COLORS } from "@/lib/sessionColors";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";
import PlanBanner from "@/features/gym/plans/components/PlanBanner";
import useActivePlan from "@/features/gym/plans/hooks/useActivePlan";
import { ExerciseEntry } from "@/types/session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { mergePlanTargets } from "@/features/gym/plans/hooks/usePlanTargetMerge";

export default function SessionsScreen() {
  const { t } = useTranslation(["gym", "common"]);
  const router = useRouter();
  const activeSession = useTimerStore((state) => state.activeSession);
  const setModalPageConfig = useModalPageConfig((s) => s.setModalPageConfig);
  const colors = SESSION_COLORS.gym;
  const { data: activePlan } = useActivePlan();

  const startPlanSession = useCallback(async () => {
    if (activeSession) {
      if (activeSession.path === "/gym/gym") {
        router.push("/gym/gym");
        return;
      }
      Toast.show({
        type: "error",
        text1: t("gym.activeSessionError"),
        text2: t("gym.activeSessionErrorSub"),
      });
      return;
    }

    if (!activePlan) return;

    try {
      // Build exercises directly from plan data (no template fetch needed)
      const workoutExercises: ExerciseEntry[] = activePlan.exercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        position: ex.position,
        name: ex.name,
        equipment: ex.equipment,
        muscle_group: ex.muscle_group ?? null,
        main_group: ex.main_group ?? null,
        sets: [],
        superset_id: ex.superset_id ?? undefined,
        rest_timer_seconds: ex.rest_timer_seconds ?? null,
      }));

      // Merge plan targets into exercise sets
      const exercisesWithTargets = mergePlanTargets(workoutExercises, activePlan.targets);

      const sessionDraft = {
        title: activePlan.day_label || activePlan.plan_name,
        exercises: exercisesWithTargets,
        warmup: null,
        cooldown: null,
        templateRestTimerSeconds: activePlan.day_rest_timer_seconds ?? null,
      };

      await AsyncStorage.setItem("gym_session_draft", JSON.stringify(sessionDraft));
      await AsyncStorage.setItem("startedFromTemplate", "true");
      await AsyncStorage.setItem("active_plan_id", activePlan.plan_id);
      router.push("/gym/gym");
    } catch {
      Toast.show({ type: "error", text1: t("common:common.error") });
    }
  }, [activeSession, activePlan, router, t]);

  useEffect(() => {
    const hasNonGymSession = activeSession && activeSession.path !== "/gym/gym";

    setModalPageConfig({
      rightLabel: t("common:navigation.start"),
      swipeEnabled: !hasNonGymSession,
      onSwipeLeft: () => {
        if (activeSession?.path === "/gym/gym") {
          router.push("/gym/gym");
          return;
        }
        if (activePlan) {
          startPlanSession();
        } else {
          router.push("/gym/gym");
        }
      },
    });
    return () => setModalPageConfig(null);
  }, [router, setModalPageConfig, t, activeSession, activePlan, startPlanSession]);

  const handleClick = () => {
    if (activeSession && activeSession?.path !== "/gym/gym") {
      Toast.show({
        type: "error",
        text1: t("gym.activeSessionError"),
        text2: t("gym.activeSessionErrorSub"),
      });
      return false;
    }

    return true;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
    <View className="px-5 max-w-md mx-auto w-full gap-4 pb-20">
      <AppText className="text-2xl text-center my-5">{t("gym.title")}</AppText>

      {/* Active Plan Banner */}
      {activePlan && (
        <View className="mb-3">
          <PlanBanner plan={activePlan} onStartSession={startPlanSession} />
        </View>
      )}

      <LinkButton
        label={t("gym.startEmptyWorkout")}
        href="/gym/gym"
        onPress={handleClick}
        gradientColors={colors.gradient}
        borderColor={colors.border}
      />

      <View className="border border-gray-400 rounded-md" />
      <LinkButton label={t("gym.createTemplate")} href="/gym/create-template" gradientColors={colors.gradient} borderColor={colors.border} />
      <LinkButton label={t("gym.templates")} href="/gym/templates" gradientColors={colors.gradient} borderColor={colors.border} />

      <LinkButton label={t("gym.plans.title")} href="/gym/plans" gradientColors={colors.gradient} borderColor={colors.border}>
        <ClipboardList color={colors.icon} className="ml-2" />
      </LinkButton>

      <View className="border border-gray-400 rounded-md" />
      <LinkButton label={t("gym.addExercise")} href="/gym/add-exercise" gradientColors={colors.gradient} borderColor={colors.border} />
      <LinkButton label={t("gym.editExercise")} href="/gym/edit-exercise" gradientColors={colors.gradient} borderColor={colors.border} />

      <View className="border border-gray-400 rounded-md" />
      <LinkButton
        label={t("gym.workoutAnalytics")}
        href="/gym/workout-analytics"
        gradientColors={colors.gradient}
        borderColor={colors.border}
      >
        <ChartNoAxesCombined color={colors.icon} className="ml-2" />
      </LinkButton>
      <LinkButton label={t("gym.mySessions.title")} href="/gym/my-sessions" gradientColors={colors.gradient} borderColor={colors.border}>
        <List color={colors.icon} className="ml-2" />
      </LinkButton>

      <View className="border border-gray-400 rounded-md" />
      <LinkButton label={t("gym.settings.title")} href="/gym/settings" gradientColors={colors.gradient} borderColor={colors.border}>
        <Settings color={colors.icon} className="ml-2" />
      </LinkButton>
    </View>
    </ScrollView>
  );
}
