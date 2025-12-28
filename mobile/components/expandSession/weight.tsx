import { formatDate } from "@/lib/formatDate";
import { useUserStore } from "@/lib/stores/useUserStore";
import { View } from "react-native";
import AppText from "../AppText";
import PageContainer from "../PageContainer";
import LinkButton from "../buttons/LinkButton";
import { FeedItemUI } from "@/types/session";

type weightPayload = {
  weight: number;
  notes: string;
};

export default function WeightSession(weight: FeedItemUI) {
  const payload = weight.extra_fields as weightPayload;

  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  return (
    <PageContainer>
      <AppText className="text-lg text-gray-400 text-center">
        {formatDate(weight.created_at!)}
      </AppText>
      <View>
        <AppText className="my-5 text-2xl text-center break-words">
          {weight.title}
        </AppText>
        <View className="whitespace-pre-wrap break-words overflow-hidden max-w-full bg-slate-900 p-4 rounded-md shadow-md mt-5">
          <View className="flex flex-col">
            {payload.notes && (
              <AppText className="mb-5 text-lg text-center">
                {payload.notes}
              </AppText> // Add gap only if notes exist
            )}
            <AppText className="text-center text-xl">
              {payload.weight} {weightUnit}
            </AppText>
          </View>
        </View>
        <View className="mt-10">
          <LinkButton label="View Full History" href="/weight/analytics" />
        </View>
      </View>
    </PageContainer>
  );
}
