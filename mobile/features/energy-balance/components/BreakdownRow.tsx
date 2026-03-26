import { View } from "react-native";
import BodyText from "@/components/BodyText";
import AppText from "@/components/AppText";

type BreakdownRowProps = {
  label: string;
  value: number;
  suffix?: string;
  detail?: string;
};

export default function BreakdownRow({
  label,
  value,
  suffix = "kcal",
  detail,
}: BreakdownRowProps) {
  return (
    <View className="flex-row justify-between items-center py-1.5">
      <View className="flex-row items-center gap-2 flex-1">
        <BodyText className="text-sm">{label}</BodyText>
        {detail ? (
          <BodyText className="text-xs text-slate-500">{detail}</BodyText>
        ) : null}
      </View>
      <AppText className="text-sm">
        {Math.round(value).toLocaleString()} {suffix}
      </AppText>
    </View>
  );
}
