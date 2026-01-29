import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import { weight } from "@/types/session";
import WeightChart from "@/Features/weight/WeightChart";
import AnimatedButton from "@/components/buttons/animatedButton";

type RangeType = "week" | "month" | "year";

const ranges: { key: RangeType; label: string }[] = [
  { key: "week", label: "7D" },
  { key: "month", label: "30D" },
  { key: "year", label: "1Y" },
];

type HeaderAllDataTableProps = {
  range: RangeType;
  setRange: (range: RangeType) => void;
  isLoading: boolean;
  error: unknown;
  data: weight[];
};

export default function HeaderAllDataTable({
  range,
  setRange,
  isLoading,
  error,
  data,
}: HeaderAllDataTableProps) {
  return (
    <>
      <AppText className="text-2xl my-5 text-center">Weight Analytics</AppText>
      <View className="flex-row bg-slate-800 rounded-lg p-1 mb-5 mx-4">
        {ranges.map((option) => (
          <AnimatedButton
            key={option.key}
            onPress={() => setRange(option.key)}
            tabClassName="flex-1"
            className={`py-2 rounded-md ${
              range === option.key ? "bg-slate-700" : ""
            }`}
          >
            <AppTextNC
              className={`text-center font-medium ${
                range === option.key ? "text-cyan-400" : "text-gray-200"
              }`}
            >
              {option.label}
            </AppTextNC>
          </AnimatedButton>
        ))}
      </View>
      <View className="w-full items-center">
        {isLoading ? (
          <View className="flex-1 justify-center items-center mt-10">
            <AppText className="text-gray-400 text-lg">
              Loading weight data...
            </AppText>
            <ActivityIndicator className="mt-2" />
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center mt-10">
            <AppText className="text-red-500">
              Error loading data. Try again...
            </AppText>
          </View>
        ) : (
          <WeightChart range={range} data={data} />
        )}
      </View>
    </>
  );
}
