import { View, Pressable, ActivityIndicator } from "react-native";
import AppText from "../AppText";
import { weight } from "@/types/models";
import WeightChart from "@/components/weight-screen/WeightChart";

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
          <Pressable
            key={option}
            className={`px-4 py-2 m-1 rounded-lg ${
              range === option ? "bg-blue-600" : "bg-gray-600"
            }`}
            onPress={() => setRange(option as "week" | "month" | "year")}
          >
            <AppText className="text-center">
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </AppText>
          </Pressable>
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
