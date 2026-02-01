import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { View, Modal, AppState } from "react-native";
import { useTimerStore } from "@/lib/stores/timerStore";
import Toast from "react-native-toast-message";
import { useEffect, useState } from "react";
import {
  canUseExactAlarm,
  requestExactAlarm,
} from "@/native/android/EnsureExactAlarmPermission";
import { Info } from "lucide-react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";

export default function TimerScreen() {
  const { t } = useTranslation("timer");
  const [showModal, setShowModal] = useState(false);

  const activeSession = useTimerStore((state) => state.activeSession);

  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await canUseExactAlarm();
      if (!allowed) {
        setShowModal(true);
        return;
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

      if (allowed) {
        setShowModal(false);
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <>
      <PageContainer>
        <AppText className="text-2xl text-center mb-10">{t("timer.title")}</AppText>
        <View className="gap-4">
          <LinkButton
            onPress={handleClick}
            label={t("timer.startTimer")}
            href="/timer/empty-timer"
          />
          <LinkButton label={t("timer.startStopwatch")} href="/timer/start-stopwatch" />
          <View className="border border-gray-400 rounded-md my-2" />
          <LinkButton label={t("timer.createTimer")} href="/timer/create-timer" />
          <LinkButton label={t("timer.myTimers")} href="/timer/my-timers" />
        </View>
      </PageContainer>

      <Modal visible={showModal} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 px-5">
          <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
            <View className="mb-5">
              <Info size={35} color="#fbbf24" />
            </View>
            <AppText className="text-xl mb-6 text-center">
              {t("timer.alarmPermission.title")}
            </AppText>
            <AppText className="text-lg mb-6 text-center">
              {t("timer.alarmPermission.description")}
            </AppText>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <LinkButton href="/sessions" label={t("timer.alarmPermission.back")} />
              </View>
              <View className="flex-1">
                <AnimatedButton
                  onPress={async () => await requestExactAlarm()}
                  label={t("timer.alarmPermission.allow")}
                  className="bg-blue-800 rounded-md shadow-md border-2 border-blue-500 py-2"
                  textClassName="text-gray-100 text-center"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
