import { View } from "react-native";
import AppText from "@/components/AppText";

type StatCardProps = {
  label: string;
  sublabel?: string;
  value: string;
};

export default function StatCard({ label, sublabel, value }: StatCardProps) {
  return (
    <View className="flex-1 min-w-[30%] items-center justify-between gap-1 border-blue-500 border py-3 px-2 rounded-lg bg-slate-950/50">
      <View className="flex-row items-center justify-center gap-1">
        <AppText
          className="text-gray-300"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </AppText>
        {sublabel && (
          <AppText className="text-gray-500 text-xs">{sublabel}</AppText>
        )}
      </View>
      <AppText className="text-gray-100 text-base text-center">{value}</AppText>
    </View>
  );
}
