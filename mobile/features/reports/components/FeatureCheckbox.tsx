import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Dumbbell, Activity, Weight, CalendarCheck, ListTodo, Check } from "lucide-react-native";
import { ReportFeature } from "@/types/report";
import * as Haptics from "expo-haptics";

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
      <AppText
        className={`flex-1 ml-3 text-base ${
          selected ? "text-gray-100" : "text-gray-400"
        }`}
      >
        {label}
      </AppText>
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
