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
    <View className="flex-1 items-center px-4 text-gray-100 max-w-md mx-auto">
      <AppText className="text-sm text-gray-400 mt-5">
        {formatDate(weight.created_at!)}
      </AppText>
      <View>
        <AppText className="my-5 text-xl text-center break-words">{weight.title}</AppText>
        <View className="whitespace-pre-wrap break-words overflow-hidden max-w-full text-left bg-slate-900 p-4 rounded-md shadow-lg">
          <View className="flex flex-col">
            {weight.notes && (
              <AppText className="mb-5">{weight.notes}</AppText> // Add gap only if notes exist
            )}
            <AppText className="text-center">
              {weight.weight} {weightUnit}
            </AppText>
          </View>
        </View>
        <Link
          asChild
          href="/weight/analytics"
          className="mt-10 w-full gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-gray-100"
        >
          <Pressable className=" px-10 bg-blue-900 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg">
           <AppText> View Full History</AppText>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
