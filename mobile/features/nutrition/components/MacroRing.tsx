import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";

type MacroRingProps = {
  value: number;
  goal: number | null;
  label: string;
  color: string;
  size?: number;
  totalMacros?: number;
};

export default function MacroRing({
  value,
  goal,
  label,
  color,
  size = 56,
  totalMacros,
}: MacroRingProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const hasGoal = goal != null && goal > 0;
  const progress = hasGoal
    ? Math.min(value / goal, 1)
    : totalMacros && totalMacros > 0
      ? value / totalMacros
      : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View className="items-center gap-1">
      <View className="items-center justify-center">
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#334155"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {progress > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          )}
        </Svg>
        <AppText className="absolute text-xs">{Math.round(value)}</AppText>
      </View>
      <BodyText className="text-xs text-slate-400">{label}</BodyText>
    </View>
  );
}
