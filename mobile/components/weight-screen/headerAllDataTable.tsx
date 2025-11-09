import { View, ActivityIndicator } from "react-native";
import AppText from "../AppText";
import { weight } from "@/types/models";
import WeightChart from "@/components/weight-screen/WeightChart";
import AnimatedButton from "../buttons/animatedButton";
import AppTextNC from "../AppTextNC";

type HeaderAllDataTableProps = {
  range: "week" | "month" | "year";
  setRange: (range: "week" | "month" | "year") => void;
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
      <View className="flex-row justify-center gap-3 mb-5">
        {["week", "month", "year"].map((option) => (
          <AnimatedButton
            key={option}
            className={`px-4 py-2 m-1 rounded-lg ${
              range === option ? "bg-blue-600" : "bg-gray-600"
            }`}
            onPress={() => setRange(option as "week" | "month" | "year")}
          >
            <AppTextNC
              className={`text-center ${
                range === option ? "text-cyan-300" : "text-gray-100"
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
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
