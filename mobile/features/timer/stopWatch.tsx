import { useTimerStore } from "@/lib/stores/timerStore";
import { View, Text, useWindowDimensions } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useConfirmAction } from "@/lib/confirmAction";
import { useTranslation } from "react-i18next";
import { formatDurationLong } from "@/lib/formatDate";

type StopwatchProps = {
  className?: string;
  textClassName?: string;
};

export default function Stopwatch({
  className = "",
  textClassName = "",
}: StopwatchProps) {
  const { t } = useTranslation("timer");
  const { width, height } = useWindowDimensions();

  const confirmAction = useConfirmAction();

  const isLandscape = width > height;

  const isRunning = useTimerStore((s) => s.isRunning);
  const pauseTimer = useTimerStore((s) => s.pauseTimer);
  const setActiveSession = useTimerStore((s) => s.setActiveSession);
  const resumeTimer = useTimerStore((s) => s.resumeTimer);
  const startTimestamp = useTimerStore((s) => s.startTimestamp);
  const clearEverything = useTimerStore((s) => s.clearEverything);
  const remainingMs = useTimerStore((s) => s.remainingMs);
  const startSession = useTimerStore((s) => s.startSession);
  const paused = useTimerStore((s) => s.paused);
  useTimerStore((s) => (s.isRunning ? s.uiTick : 0));

  const handleStart = () => {
    setActiveSession({
      type: t("timer.stopwatch.title"),
      label: `${t("timer.stopwatch.title")}`,
      path: "/timer/start-stopwatch",
    });

    if (paused) {
      resumeTimer(t("timer.stopwatch.title"));
    } else {
      startSession(t("timer.stopwatch.title"));
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const now = Date.now();

  const displaySeconds = isRunning
    ? Math.floor((now - startTimestamp!) / 1000)
    : Math.floor(remainingMs! / 1000);

  const timerWidth = isLandscape ? width : width * 0.95;
  const timerFontSize = isLandscape ? height * 0.6 : 200;

  const cancelStopwatch = async () => {
    const confirmCancel = await confirmAction({
      title: t("timer.stopwatch.cancelSessionTitle"),
      message: t("timer.stopwatch.cancelSessionMessage"),
    });

    if (!confirmCancel) return;

    clearEverything();
    AsyncStorage.removeItem("timer_session_draft");
    router.replace("/timer");
  };

  return (
    <View className={`items-center flex-col ${className}`}>
      <View className="items-center" style={{ width: timerWidth }}>
        <Text
          style={{
            fontSize: timerFontSize,
            includeFontPadding: false,
            textAlign: "center",
          }}
          className={`font-mono font-bold text-gray-100 ${textClassName}`}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.1}
        >
          {formatDurationLong(displaySeconds)}
        </Text>
      </View>

      {isRunning ? (
        <View className="flex-row gap-5 w-full justify-center">
          <View className="w-1/3">
            <AnimatedButton
              onPress={cancelStopwatch}
              className="btn-danger"
              label={t("timer.stopwatch.cancel")}
            />
          </View>
          <View className="w-1/3">
            <AnimatedButton
              onPress={handlePause}
              className="btn-base"
              label={t("timer.stopwatch.pause")}
            />
          </View>
        </View>
      ) : (
        <View className="flex-row gap-5 w-full justify-center">
          <View className="w-1/3">
            <AnimatedButton
              onPress={cancelStopwatch}
              className="btn-danger"
              label={t("timer.stopwatch.cancel")}
            />
          </View>
          <View className="w-1/3">
            <AnimatedButton
              onPress={handleStart}
              className="btn-start"
              label={t("timer.stopwatch.start")}
            />
          </View>
        </View>
      )}
    </View>
  );
}
