import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import { useTranslation } from "react-i18next";

type CalorieRingProps = {
  consumed: number;
  goal: number;
  size?: number;
};

export default function CalorieRing({
  consumed,
  goal,
  size = 160,
}: CalorieRingProps) {
  const { t } = useTranslation("nutrition");
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const remaining = goal - consumed;
  const isOver = remaining < 0;

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#334155"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? "#ef4444" : "#f97316"}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View className="absolute items-center">
        <AppText className="text-2xl">{consumed}</AppText>
        <BodyText className="text-sm text-slate-400">
          / {goal} {t("feed.kcal")}
        </BodyText>
        <AppTextNC
          className={`text-xs mt-1 ${isOver ? "text-red-400" : "text-orange-400"}`}
        >
          {Math.abs(remaining)} {isOver ? t("daily.over") : t("daily.remaining")}
        </AppTextNC>
      </View>
    </View>
  );
}
