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
import { router } from "expo-router";

export default function TimerScreen() {
  const { t } = useTranslation("timer");
  const [showModal, setShowModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);

  const activeSession = useTimerStore((state) => state.activeSession);

  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await canUseExactAlarm();
      if (!allowed) {
        setShowModal(true);
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
      if (allowed && showModal) {
        setShowModal(false);
        if (!useUserStore.getState().settings?.push_enabled) {
          setShowPushModal(true);
        }
      }
    });

    return () => {
      sub.remove();
    };
  }, [showModal]);

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
          />
          <LinkButton
            label={t("timer.startStopwatch")}
            href="/timer/start-stopwatch"
          />
          <View className="border border-gray-400 rounded-md my-2" />
          <LinkButton
            label={t("timer.createTimer")}
            href="/timer/create-timer"
          />
          <LinkButton label={t("timer.myTimers")} href="/timer/my-timers" />
        </View>
      </PageContainer>

      <InfoModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
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
        onClose={() => setShowPushModal(false)}
        title={t("timer.pushPermission.title")}
        description={t("timer.pushPermission.description")}
        cancelLabel={t("timer.pushPermission.skip")}
        confirmLabel={t("timer.pushPermission.settings")}
        onConfirm={() => {
          setShowPushModal(false);
          router.push("/menu/settings");
        }}
      />
    </>
  );
}
