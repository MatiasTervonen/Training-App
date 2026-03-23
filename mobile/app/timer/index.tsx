import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { View, AppState } from "react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import Toast from "react-native-toast-message";
import { useEffect, useState } from "react";
import {
  canUseExactAlarm,
  requestExactAlarm,
} from "@/native/android/EnsureExactAlarmPermission";
import InfoModal from "@/components/InfoModal";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/lib/stores/useUserStore";
import { SESSION_COLORS } from "@/lib/sessionColors";
import { router } from "expo-router";

export default function TimerScreen() {
  const { t } = useTranslation("timer");
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const colors = SESSION_COLORS.timer;

  const activeSession = useTimerStore((state) => state.activeSession);
  const pushEnabled = useUserStore((state) => state.settings?.push_enabled);
  const showPushModal = pushEnabled === false;

  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await canUseExactAlarm();
      if (!allowed) {
        setShowAlarmModal(true);
      }
    };
    checkPermission();
  }, []);

  const handleClick = () => {
    if (activeSession) {
      Toast.show({
        type: "error",
        text1: t("timer.activeSessionError"),
        text2: t("timer.activeSessionErrorSub"),
      });
      return false;
    }

    return true;
  };

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;

      const allowed = await canUseExactAlarm();
      if (allowed && showAlarmModal) {
        setShowAlarmModal(false);
      }
    });

    return () => {
      sub.remove();
    };
  }, [showAlarmModal]);

  return (
    <>
      <PageContainer>
        <AppText className="text-2xl text-center mb-10">
          {t("timer.title")}
        </AppText>
        <View className="gap-4">
          <LinkButton
            onPress={handleClick}
            label={t("timer.startTimer")}
            href="/timer/empty-timer"
            gradientColors={colors.gradient}
            borderColor={colors.border}
          />
          <LinkButton
            onPress={handleClick}
            label={t("timer.startStopwatch")}
            href="/timer/start-stopwatch"
            gradientColors={colors.gradient}
            borderColor={colors.border}
          />
          <View className="border border-gray-400 rounded-md my-2" />
          <LinkButton
            label={t("timer.createTimer")}
            href="/timer/create-timer"
            gradientColors={colors.gradient}
            borderColor={colors.border}
          />
          <LinkButton label={t("timer.myTimers")} href="/timer/my-timers" gradientColors={colors.gradient} borderColor={colors.border} />
        </View>
      </PageContainer>

      <InfoModal
        visible={showAlarmModal}
        onClose={() => {
          setShowAlarmModal(false);
          router.back();
        }}
        title={t("timer.alarmPermission.title")}
        description={t("timer.alarmPermission.description")}
        cancelLabel={t("timer.alarmPermission.back")}
        confirmLabel={t("timer.alarmPermission.allow")}
        onConfirm={() => requestExactAlarm()}
      />

      <InfoModal
        visible={showPushModal}
        onClose={() => router.replace("/sessions")}
        title={t("timer.pushPermission.title")}
        description={t("timer.pushPermission.description")}
        customActions={
          <>
            <View className="flex-1">
              <LinkButton href="/sessions" label={t("timer.pushPermission.skip")} gradientColors={colors.gradient} borderColor={colors.border} />
            </View>
            <View className="flex-1">
              <LinkButton
                href="/menu/settings"
                label={t("timer.pushPermission.settings")}
                gradientColors={colors.gradient}
                borderColor={colors.border}
              />
            </View>
          </>
        }
      />
    </>
  );
}
