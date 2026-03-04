import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { StatItem } from "@/features/activities/lib/activityShareCardUtils";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

type StatToggleChipsProps = {
  availableStats: StatItem[];
  selectedKeys: Set<string>;
  onToggle: (key: string) => void;
};

export default function StatToggleChips({
  availableStats,
  selectedKeys,
  onToggle,
}: StatToggleChipsProps) {
  const { t } = useTranslation("activities");

  const handleToggle = (key: string) => {
    const isSelected = selectedKeys.has(key);

    if (isSelected && selectedKeys.size <= 2) {
      Toast.show({
        type: "info",
        text1: t("activities.share.minStats"),
      });
      return;
    }

    if (!isSelected && selectedKeys.size >= 7) {
      Toast.show({
        type: "info",
        text1: t("activities.share.maxStats"),
      });
      return;
    }

    onToggle(key);
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {availableStats.map((stat) => {
        const isSelected = selectedKeys.has(stat.key);
        return (
          <AnimatedButton
            key={stat.key}
            onPress={() => handleToggle(stat.key)}
            className={`px-4 py-2 rounded-full border ${
              isSelected
                ? "bg-blue-700 border-blue-500"
                : "bg-transparent border-gray-500"
            }`}
          >
            <AppText
              className={`text-sm ${isSelected ? "text-gray-100" : "text-gray-400"}`}
            >
              {stat.label}
            </AppText>
          </AnimatedButton>
        );
      })}
    </View>
  );
}
