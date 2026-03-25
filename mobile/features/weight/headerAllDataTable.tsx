import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import ErrorMessage from "@/components/ErrorMessage";
import { weight } from "@/types/session";
import WeightChart from "@/features/weight/WeightChart";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Share2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import AppTextNC from "@/components/AppTextNC";

type RangeType = "week" | "month" | "year";

type RangeOption = { key: RangeType; translationKey: string };

const ranges: RangeOption[] = [
  { key: "week", translationKey: "weight.analyticsScreen.range7d" },
  { key: "month", translationKey: "weight.analyticsScreen.range30d" },
  { key: "year", translationKey: "weight.analyticsScreen.range1y" },
];

type HeaderAllDataTableProps = {
  range: RangeType;
  setRange: (range: RangeType) => void;
  isLoading: boolean;
  error: unknown;
  data: weight[];
  onSharePress: () => void;
};

export default function HeaderAllDataTable({
  range,
  setRange,
  isLoading,
  error,
  data,
  onSharePress,
}: HeaderAllDataTableProps) {
  const { t } = useTranslation("weight");

  return (
    <>
      <View className="flex-row items-center gap-2 mb-2 mx-4 mt-2">
        <View className="flex-row flex-1 bg-slate-800 rounded-lg p-1">
          {ranges.map((option) => (
            <AnimatedButton
              key={option.key}
              onPress={() => setRange(option.key)}
              className={`flex-1 py-2 rounded-md ${
                range === option.key ? "bg-slate-700" : ""
              }`}
            >
              <AppTextNC
                className={`text-center font-medium ${
                  range === option.key ? "text-amber-400" : "text-gray-200"
                }`}
              >
                {t(option.translationKey)}
              </AppTextNC>
            </AnimatedButton>
          ))}
        </View>
        <AnimatedButton onPress={onSharePress} hitSlop={10}>
          <Share2 color="#f3f4f6" size={22} />
        </AnimatedButton>
      </View>
      <View className="w-full items-center">
        {isLoading ? (
          <View className="flex-1 justify-center items-center mt-10">
            <AppText className="text-gray-400 text-lg">
              {t("weight.analyticsScreen.loading")}
            </AppText>
            <ActivityIndicator className="mt-2" />
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center mt-10">
            <ErrorMessage message={t("weight.analyticsScreen.error")} />
          </View>
        ) : (
          <WeightChart range={range} data={data} />
        )}
      </View>
    </>
  );
}
