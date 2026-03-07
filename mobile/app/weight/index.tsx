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
      <AnimatedButton
        onPress={() => router.push("/weight/tracking")}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center border-2 border-blue-400"
      >
        <Plus size={28} color="#f3f4f6" />
      </AnimatedButton>
    </>
  );
}
