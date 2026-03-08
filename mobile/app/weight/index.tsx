import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import AllDataTable from "@/features/weight/AllDataTable";
import { getWeight } from "@/database/weight/get-weight";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus } from "lucide-react-native";

export default function WeightScreen() {
  const router = useRouter();

  const {
    data: weightData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["get-weight"],
    queryFn: getWeight,
  });

  return (
    <>
      <AllDataTable data={weightData ?? []} isLoading={isLoading} error={error} />
      <View className="absolute bottom-8 right-6">
        <View className="absolute -inset-1 rounded-full bg-cyan-400/30" />
        <View className="absolute -inset-3 rounded-full bg-cyan-400/15" />
        <View className="absolute -inset-5 rounded-full bg-cyan-400/5" />
        <AnimatedButton
          onPress={() => router.push("/weight/tracking")}
          className="w-14 h-14 rounded-full bg-slate-800 items-center justify-center shadow-xl shadow-cyan-400/60 border-2 border-cyan-300"
        >
          <Plus size={30} color="#67e8f9" />
        </AnimatedButton>
      </View>
    </>
  );
}
