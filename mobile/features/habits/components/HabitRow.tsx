import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import Toggle from "@/components/toggle";
import { Habit } from "@/types/habit";

type HabitRowProps = {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
  onPress: () => void;
};

export default function HabitRow({
  habit,
  isCompleted,
  onToggle,
  onPress,
}: HabitRowProps) {
  return (
    <AnimatedButton
      onPress={onPress}
      className="flex-row items-center justify-between py-3 px-4 bg-gray-800 rounded-lg mb-2"
    >
      <AppText
        className={`text-lg ${isCompleted ? "text-green-400" : "text-gray-100"}`}
      >
        {habit.name}
      </AppText>
      <Toggle
        isOn={isCompleted}
        onToggle={onToggle}
      />
    </AnimatedButton>
  );
}
