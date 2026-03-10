import { View } from "react-native";
import AppText from "@/components/AppText";

type StatCardProps = {
  label: string;
  value: string;
};

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <View className="flex-1 min-w-[30%] items-center justify-center gap-1 border-blue-500 border py-3 px-2 rounded-lg bg-slate-950/50">
      <AppText
        className="text-xs text-gray-400"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </AppText>
      <AppText className="text-base text-gray-100 text-center">{value}</AppText>
    </View>
  );
}
