import { View } from "react-native";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import { useTranslation } from "react-i18next";

type Props = {
  currentWeek: number;
  totalWeeks: number | null;
  currentPosition: number;
  dayCount: number;
};

export default function PlanProgressBar({ currentWeek, totalWeeks, currentPosition, dayCount }: Props) {
  const { t } = useTranslation("gym");

  if (!totalWeeks) {
    return (
      <View className="gap-1">
        <BodyText className="text-sm">
          {t("gym.plans.weekInfinite", { current: currentWeek })} · {t("gym.plans.day", { number: currentPosition + 1 })}
        </BodyText>
      </View>
    );
  }

  const totalSessions = totalWeeks * dayCount;
  const completedSessions = (currentWeek - 1) * dayCount + currentPosition;
  const progressPercent = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <BodyText className="text-sm">
          {t("gym.plans.progress")}
        </BodyText>
        <AppTextNC className="text-sm text-cyan-400">
          {Math.round(progressPercent)}%
        </AppTextNC>
      </View>
      <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <View
          className="h-full bg-cyan-500 rounded-full"
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </View>
      <BodyText className="text-xs">
        {t("gym.plans.weekOf", { current: currentWeek, total: totalWeeks })} · {t("gym.plans.day", { number: currentPosition + 1 })} / {dayCount}
      </BodyText>
    </View>
  );
}
