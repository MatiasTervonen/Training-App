import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import Toggle from "@/components/toggle";
import { Habit } from "@/types/habit";
import { useTranslation } from "react-i18next";

type HabitRowProps = {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
  onPress: () => void;
  currentSteps?: number;
};

export default function HabitRow({
  habit,
  isCompleted,
  onToggle,
  onPress,
  currentSteps,
}: HabitRowProps) {
  const { t } = useTranslation("habits");
  const isStepHabit = habit.type === "steps" && habit.target_value;

  return (
    <AnimatedButton
      onPress={onPress}
      className="py-3 px-4 bg-gray-800 rounded-lg mb-2"
    >
      <View className="flex-row items-center justify-between">
        <AppText
          className={`text-lg ${isCompleted ? "text-green-400" : "text-gray-100"}`}
        >
          {habit.name}
        </AppText>
        <Toggle
          isOn={isCompleted}
          onToggle={onToggle}
        />
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
          <AppText className="text-xs text-gray-400 mt-1">
            {isCompleted
              ? currentSteps.toLocaleString()
              : t("stepProgress", {
                  current: currentSteps.toLocaleString(),
                  target: habit.target_value!.toLocaleString(),
                })}
          </AppText>
        </View>
      )}
    </AnimatedButton>
  );
}
