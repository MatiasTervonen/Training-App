import { formatDate } from "@/lib/formatDate";
import { useUserStore } from "@/lib/stores/useUserStore";
import { Feed_item } from "@/types/session";
import { Link } from "expo-router";
import { View, Pressable } from "react-native";
import AppText from "../AppText";

export default function WeightSession(weight: Feed_item) {
  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  return (
    <View className="flex-1 items-center">
      <AppText className="text-lg text-gray-400 mt-10">
        {formatDate(weight.created_at!)}
      </AppText>
      <View>
        <AppText className="my-5 text-2xl text-center break-words">
          {weight.title}
        </AppText>
        <View className="whitespace-pre-wrap break-words overflow-hidden max-w-full bg-slate-900 p-4 rounded-md shadow-md mt-5">
          <View className="flex flex-col">
            {weight.notes && (
              <AppText className="mb-5 text-lg text-center">{weight.notes}</AppText> // Add gap only if notes exist
            )}
            <AppText className="text-center text-xl">
              {weight.weight} {weightUnit}
            </AppText>
          </View>
        </View>
        <Link
          asChild
          href="/weight/analytics"
          className="mt-10 w-full gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-gray-100"
        >
          <Pressable className="px-10 bg-blue-900 py-2 rounded-md shadow-md border-2 border-blue-500 ">
            <AppText className="text-xl"> View Full History</AppText>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
