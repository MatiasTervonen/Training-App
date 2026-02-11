import { formatDate } from "@/lib/formatDate";
import { useUserStore } from "@/lib/stores/useUserStore";
import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import PageContainer from "@/components/PageContainer";
import LinkButton from "@/components/buttons/LinkButton";
import { FeedItemUI } from "@/types/session";
import { useQuery } from "@tanstack/react-query";
import { getWeight } from "@/database/weight/get-weight";
import WeightFeedChart from "@/features/weight/WeightFeedChart";
import { ChartNoAxesCombined } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type weightPayload = {
  weight: number;
  notes: string;
};

export default function WeightSession(weight: FeedItemUI) {
  const { t } = useTranslation("weight");
  const payload = weight.extra_fields as weightPayload;

  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  const {
    data: weightData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["get-weight"],
    queryFn: getWeight,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return (
    <PageContainer>
      <AppText className="text-sm text-gray-400 text-center">
        {t("weight.created")}: {formatDate(weight.created_at!)}
      </AppText>
      <View className="justify-between flex-1">
        <View>
          <AppText className="my-5 text-2xl text-center break-words">
            {weight.title}
          </AppText>
          <View className="bg-slate-900 p-4 rounded-md shadow-md mt-5">
            <View className="flex flex-col">
              {payload.notes && (
                <BodyText className="mb-5 text-center">
                  {payload.notes}
                </BodyText>
              )}
              <AppText className="text-center text-xl">
                {payload.weight} {weightUnit}
              </AppText>
            </View>
          </View>

          {isLoading ? (
            <View className="mt-5 bg-slate-900 shadow-md rounded-md p-4 h-[340px]">
              <View className="justify-center items-center flex-1">
                <ActivityIndicator size="large" color="#f3f4f6" />
              </View>
            </View>
          ) : error ? (
            <View className="mt-5 bg-slate-900 shadow-md rounded-md p-4 h-[340px]">
              <View className="justify-center items-center flex-1">
                <AppText className="text-red-500">
                  {t("weight.chartError")}
                </AppText>
              </View>
            </View>
          ) : (
            weightData &&
            weightData.length > 0 && (
              <View className="mt-5 bg-slate-900 shadow-md rounded-md">
                <WeightFeedChart data={weightData} />
              </View>
            )
          )}
        </View>
        <View className="my-10">
          <LinkButton label={t("weight.fullAnalytics")} href="/weight/analytics">
            <ChartNoAxesCombined color="#f3f4f6" className="ml-2" />
          </LinkButton>
        </View>
      </View>
    </PageContainer>
  );
}
