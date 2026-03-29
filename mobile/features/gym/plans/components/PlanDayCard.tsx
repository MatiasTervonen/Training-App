import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AppTextNC from "@/components/AppTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react-native";

type Props = {
  dayNumber: number;
  label: string | null;
  exerciseCount: number;
  isCurrent?: boolean;
  onRemove?: () => void;
};

export default function PlanDayCard({ dayNumber, label, exerciseCount, isCurrent, onRemove }: Props) {
  const { t } = useTranslation("gym");

  return (
    <LinearGradient
      colors={
        isCurrent
          ? ["rgba(34,211,238,0.15)", "rgba(34,211,238,0.05)"]
          : ["rgba(59,130,246,0.12)", "rgba(59,130,246,0.04)"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`border rounded-md overflow-hidden ${isCurrent ? "border-cyan-700" : "border-slate-700"}`}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2">
            <AppTextNC className={`text-sm ${isCurrent ? "text-cyan-400" : "text-slate-400"}`}>
              {t("gym.plans.day", { number: dayNumber })}
            </AppTextNC>
            {isCurrent && (
              <View className="bg-cyan-900/50 px-2 py-0.5 rounded">
                <AppTextNC className="text-xs text-cyan-300">
                  {t("gym.plans.nextSession", { name: "" }).replace(": ", "")}
                </AppTextNC>
              </View>
            )}
          </View>
          {label && (
            <AppText className="text-base" numberOfLines={1}>
              {label}
            </AppText>
          )}
          {exerciseCount > 0 && (
            <BodyText className="text-sm">
              {t("gym.plans.exercisesCount", { count: exerciseCount })}
            </BodyText>
          )}
        </View>
        {onRemove && (
          <AnimatedButton onPress={onRemove} hitSlop={10}>
            <Trash2 size={18} color="#ef4444" />
          </AnimatedButton>
        )}
      </View>
    </LinearGradient>
  );
}
