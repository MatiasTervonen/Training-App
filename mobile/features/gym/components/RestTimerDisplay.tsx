import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useRestTimerStore } from "@/lib/stores/restTimerStore";
import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function RestTimerDisplay() {
  const isRunning = useRestTimerStore((state) => state.isRunning);
  const endTimestamp = useRestTimerStore((state) => state.endTimestamp);
  // Subscribe to uiTick so component re-renders every second
  useRestTimerStore((state) => state.uiTick);
  const skipRestTimer = useRestTimerStore((state) => state.skipRestTimer);
  const { t } = useTranslation("gym");

  if (!isRunning || !endTimestamp) return null;

  const remainingSeconds = Math.max(
    0,
    Math.ceil((endTimestamp - Date.now()) / 1000),
  );

  return (
    <View className="flex-row items-center gap-2 ml-4">
      <AppText className="text-xl font-bold font-mono text-amber-400">
        {t("gym.restTimer.label")}: {formatTime(remainingSeconds)}
      </AppText>
      <AnimatedButton onPress={skipRestTimer} className="p-1" hitSlop={15}>
        <X size={18} color="#fbbf24" />
      </AnimatedButton>
    </View>
  );
}
