import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import AllDataTable from "@/components/weight-screen/AllDataTable";
import { getWeight } from "@/api/weight/get-weight";

export default function AnalyticsScreen() {
  const {
    data: weightData,
    error,
    isLoading,
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
    <View>
      <AllDataTable data={weightData ?? []} isLoading={isLoading} error={error} />
    </View>
  );
}
