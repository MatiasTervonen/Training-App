import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppTextNC from "@/components/AppTextNC";

type Props = {
  totalWeeks: number;
  selectedWeek: number;
  onSelectWeek: (week: number) => void;
};

export default function WeekSelector({ totalWeeks, selectedWeek, onSelectWeek }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
        <AnimatedButton
          key={week}
          onPress={() => onSelectWeek(week)}
          className={`px-6 py-2 rounded-lg border ${
            selectedWeek === week
              ? "border-cyan-500 bg-cyan-900/30"
              : "border-slate-700 bg-slate-800/50"
          }`}
        >
          <AppTextNC
            className={`text-sm ${selectedWeek === week ? "text-cyan-400" : "text-slate-400"}`}
            numberOfLines={1}
          >
            W{week}
          </AppTextNC>
        </AnimatedButton>
      ))}
    </View>
  );
}
