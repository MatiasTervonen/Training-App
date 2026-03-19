import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Dumbbell, Activity, Weight, CalendarCheck, ListTodo, Check } from "lucide-react-native";
import { ReportFeature } from "@/types/report";
import * as Haptics from "expo-haptics";
import AppTextNC from "@/components/AppTextNC";

const FEATURE_ICONS: Record<ReportFeature, typeof Dumbbell> = {
  gym: Dumbbell,
  activities: Activity,
  weight: Weight,
  habits: CalendarCheck,
  todo: ListTodo,
};

type FeatureCheckboxProps = {
  featureKey: ReportFeature;
  label: string;
  selected: boolean;
  onToggle: () => void;
};

export default function FeatureCheckbox({
  featureKey,
  label,
  selected,
  onToggle,
}: FeatureCheckboxProps) {
  const Icon = FEATURE_ICONS[featureKey];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <AnimatedButton
      onPress={handlePress}
      className={`flex-row items-center px-4 py-3 rounded-lg border ${
        selected
          ? "bg-blue-900/50 border-blue-500"
          : "bg-gray-800/50 border-gray-600"
      }`}
    >
      <Icon size={20} color={selected ? "#93c5fd" : "#9ca3af"} />
      <AppTextNC
        className={`flex-1 ml-3 text-base ${
          selected ? "text-gray-100" : "text-gray-400"
        }`}
      >
        {label}
      </AppTextNC>
      <View
        className={`w-6 h-6 rounded items-center justify-center ${
          selected ? "bg-blue-600" : "bg-gray-700 border border-gray-500"
        }`}
      >
        {selected && <Check size={16} color="#fff" />}
      </View>
    </AnimatedButton>
  );
}
