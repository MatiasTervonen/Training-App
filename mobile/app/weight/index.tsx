import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import AllDataTable from "@/features/weight/AllDataTable";
import { getWeight } from "@/database/weight/get-weight";
import FloatingActionButton from "@/components/buttons/FloatingActionButton";
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
      <FloatingActionButton onPress={() => router.push("/weight/tracking")}>
        <Plus size={30} color="#06b6d4" />
      </FloatingActionButton>
    </>
  );
}
