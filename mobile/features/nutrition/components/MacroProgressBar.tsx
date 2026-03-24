import { View } from "react-native";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";

type MacroProgressBarProps = {
  label: string;
  current: number;
  goal: number | null;
  color: string; // tailwind color class like "bg-blue-500"
  unit?: string;
};

export default function MacroProgressBar({
  label,
  current,
  goal,
  color,
  unit = "g",
}: MacroProgressBarProps) {
  const progress = goal ? Math.min(current / goal, 1) : 0;
  const percentage = Math.round(progress * 100);

  return (
    <View className="gap-1">
      <View className="flex-row justify-between items-center">
        <BodyText className="text-sm">{label}</BodyText>
        <BodyTextNC className="text-sm text-slate-400">
          {Math.round(current)}
          {goal ? ` / ${Math.round(goal)}` : ""} {unit}
        </BodyTextNC>
      </View>
      {goal ? (
        <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </View>
      ) : null}
    </View>
  );
}
