import { View, Text, Alert } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import Toggle from "@/components/toggle";
import { Habit } from "@/types/habit";
import { useTranslation } from "react-i18next";
import { formatDurationLong } from "@/lib/formatDate";
import { useTimerStore } from "@/lib/stores/timerStore";
import { useHabitContextStore } from "@/features/habits/hooks/useHabitTimer";
import { Play, Pause, RotateCw } from "lucide-react-native";
import AppTextNC from "@/components/AppTextNC";

type HabitRowProps = {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
  onPress: () => void;
  currentSteps?: number;
  accumulatedSeconds?: number;
  habitTimerState?: "idle" | "running" | "paused";
  onStartTimer?: () => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
};

function DurationProgress({
  habit,
  accumulatedSeconds,
  timerState,
  isCompleted,
}: {
  habit: Habit;
  accumulatedSeconds: number;
  timerState: "idle" | "running" | "paused";
  isCompleted: boolean;
}) {
  // Subscribe to uiTick only when running (triggers re-render every second)
  useTimerStore((s) => (timerState === "running" ? s.uiTick : 0));

  const targetSeconds = habit.target_value!;
  let currentAccumulated = accumulatedSeconds;

  if (timerState === "running" || timerState === "paused") {
    const store = useTimerStore.getState();
    const ctx = useHabitContextStore.getState().context;
    if (ctx) {
      if (timerState === "running" && store.endTimestamp) {
        const remainingNow = Math.max(0, store.endTimestamp - Date.now()) / 1000;
        const remainingAtStart = ctx.targetSeconds - ctx.accumulatedAtStart;
        const elapsed = Math.max(0, remainingAtStart - remainingNow);
        currentAccumulated = Math.round(ctx.accumulatedAtStart + elapsed);
      } else if (timerState === "paused" && store.remainingMs != null) {
        const remainingAtStart = ctx.targetSeconds - ctx.accumulatedAtStart;
        const elapsed = Math.max(0, remainingAtStart - store.remainingMs / 1000);
        currentAccumulated = Math.round(ctx.accumulatedAtStart + elapsed);
      }
    }
  }

  const remaining = Math.max(0, targetSeconds - currentAccumulated);
  const remainingRatio = remaining / targetSeconds;

  return (
    <View className="mt-2">
      <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${isCompleted ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${(isCompleted ? 1 : remainingRatio) * 100}%` }}
        />
      </View>
      <Text className="text-xs text-gray-400 mt-1 font-mono">
        {isCompleted
          ? formatDurationLong(targetSeconds)
          : `${formatDurationLong(remaining)} / ${formatDurationLong(targetSeconds)}`}
      </Text>
    </View>
  );
}

export default function HabitRow({
  habit,
  isCompleted,
  onToggle,
  onPress,
  currentSteps,
  accumulatedSeconds = 0,
  habitTimerState = "idle",
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
}: HabitRowProps) {
  const { t } = useTranslation("habits");
  const isStepHabit = habit.type === "steps" && habit.target_value;
  const isDurationHabit = habit.type === "duration" && habit.target_value;

  const handleDurationToggleOff = () => {
    Alert.alert(
      t("durationResetTitle"),
      t("durationResetMessage"),
      [
        { text: t("durationResetCancel"), style: "cancel" },
        { text: t("durationResetConfirm"), style: "destructive", onPress: onToggle },
      ],
    );
  };

  return (
    <AnimatedButton
      onPress={onPress}
      className="py-3 px-4 bg-slate-500/10 border border-slate-500/20 rounded-lg mb-2"
    >
      <View className="flex-row items-center justify-between">
        <AppTextNC
          className={`flex-1 shrink text-lg mr-3 ${isCompleted ? "text-green-400" : "text-gray-100"}`}
        >
          {habit.name}
        </AppTextNC>
        {isDurationHabit && !isCompleted ? (
          <DurationTimerButton
            timerState={habitTimerState}
            onStart={onStartTimer}
            onPause={onPauseTimer}
            onResume={onResumeTimer}
          />
        ) : (
          <Toggle
            isOn={isCompleted}
            onToggle={isDurationHabit && isCompleted ? handleDurationToggleOff : onToggle}
          />
        )}
      </View>
      {isStepHabit && currentSteps !== undefined && (
        <View className="mt-2">
          <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${isCompleted ? "bg-green-500" : "bg-blue-500"}`}
              style={{
                width: `${Math.min((currentSteps / habit.target_value!) * 100, 100)}%`,
              }}
            />
          </View>
          <AppText className="text-xs text-gray-400 mt-1 font-mono">
            {isCompleted
              ? currentSteps.toLocaleString()
              : t("stepProgress", {
                  current: currentSteps.toLocaleString(),
                  target: habit.target_value!.toLocaleString(),
                })}
          </AppText>
        </View>
      )}
      {isDurationHabit && (
        <DurationProgress
          habit={habit}
          accumulatedSeconds={accumulatedSeconds}
          timerState={habitTimerState}
          isCompleted={isCompleted}
        />
      )}
    </AnimatedButton>
  );
}

function DurationTimerButton({
  timerState,
  onStart,
  onPause,
  onResume,
}: {
  timerState: "idle" | "running" | "paused";
  onStart?: (() => void) | undefined;
  onPause?: (() => void) | undefined;
  onResume?: (() => void) | undefined;
}) {
  const { t } = useTranslation("habits");

  if (timerState === "running") {
    return (
      <AnimatedButton
        onPress={() => onPause?.()}
        className="bg-yellow-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5"
        hitSlop={5}
      >
        <Pause size={14} color="#f3f4f6" />
        <AppText className="text-sm">
          {t("habitTimerPause")}
        </AppText>
      </AnimatedButton>
    );
  }

  if (timerState === "paused") {
    return (
      <AnimatedButton
        onPress={() => onResume?.()}
        className="bg-blue-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5"
        hitSlop={5}
      >
        <RotateCw size={14} color="#f3f4f6" />
        <AppText className="text-sm">
          {t("habitTimerResume")}
        </AppText>
      </AnimatedButton>
    );
  }

  return (
    <AnimatedButton
      onPress={() => onStart?.()}
      className="bg-green-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5"
      hitSlop={5}
    >
      <Play size={14} color="#f3f4f6" />
      <AppText className="text-sm">
        {t("habitTimerStart")}
      </AppText>
    </AnimatedButton>
  );
}
