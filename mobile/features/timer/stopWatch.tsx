import { useTimerStore } from "@/lib/stores/timerStore";
import { View, Text, useWindowDimensions } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useConfirmAction } from "@/lib/confirmAction";
import { useTranslation } from "react-i18next";
import { formatDateShort } from "@/lib/formatDate";

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

  const {
    isRunning,
    pauseTimer,
    setActiveSession,
    resumeTimer,
    startTimestamp,
    clearEverything,
    remainingMs,
    startSession,
    paused,
  } = useTimerStore();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const handleStart = () => {
    setActiveSession({
      type: t("timer.stopwatch.title"),
      label: `${t("timer.stopwatch.title")} - ${formatDateShort(new Date())}`,
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
          {formatTime(displaySeconds)}
        </Text>
      </View>

      {isRunning ? (
        <View className="flex-row gap-5 w-full justify-center">
          <View className="w-1/3">
            <AnimatedButton
              onPress={cancelStopwatch}
              className="bg-red-600 border-2 border-red-400 py-2 px-4 shadow-md rounded-md items-center justify-center"
              textClassName="text-gray-100"
              label={t("timer.stopwatch.cancel")}
            />
          </View>
          <View className="w-1/3">
            <AnimatedButton
              onPress={handlePause}
              className="flex-row justify-center items-center gap-2 bg-blue-800 py-2 border-2 border-blue-500 rounded-md px-4"
              textClassName="text-gray-100"
              label={t("timer.stopwatch.pause")}
            />
          </View>
        </View>
      ) : (
        <View className="flex-row gap-5 w-full justify-center">
          <View className="w-1/3">
            <AnimatedButton
              onPress={cancelStopwatch}
              className="bg-red-600 border-2 border-red-400 py-2 px-4 shadow-md rounded-md items-center justify-center"
              textClassName="text-gray-100"
              label={t("timer.stopwatch.cancel")}
            />
          </View>
          <View className="w-1/3">
            <AnimatedButton
              onPress={handleStart}
              className="flex-row justify-center items-center gap-2 bg-blue-800 py-2 border-2 border-blue-500 rounded-md px-4"
              textClassName="text-gray-100"
              label={t("timer.stopwatch.start")}
            />
          </View>
        </View>
      )}
    </View>
  );
}
