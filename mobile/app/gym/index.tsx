import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import { useTimerStore } from "@/lib/stores/timerStore";
import Toast from "react-native-toast-message";
import { List, ChartNoAxesCombined, Settings } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { SESSION_COLORS } from "@/lib/sessionColors";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";

export default function SessionsScreen() {
  const { t } = useTranslation(["gym", "common"]);
  const router = useRouter();
  const activeSession = useTimerStore((state) => state.activeSession);
  const setModalPageConfig = useModalPageConfig((s) => s.setModalPageConfig);
  const colors = SESSION_COLORS.gym;

  useEffect(() => {
    setModalPageConfig({
      rightLabel: t("common:navigation.start"),
      onSwipeLeft: () => {
        if (activeSession && activeSession?.type !== "gym") {
          Toast.show({
            type: "error",
            text1: t("gym:gym.activeSessionError"),
            text2: t("gym:gym.activeSessionErrorSub"),
          });
          return;
        }
        router.push("/gym/gym");
      },
    });
    return () => setModalPageConfig(null);
  }, [router, setModalPageConfig, t, activeSession]);

  const handleClick = () => {
    if (activeSession && activeSession?.type !== "gym") {
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
    <View className="px-5 max-w-md mx-auto w-full gap-4">
      <AppText className="text-2xl text-center my-5">{t("gym.title")}</AppText>
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
  );
}
