import { useQuery } from "@tanstack/react-query";
import AllDataTable from "@/Features/weight/AllDataTable";
import { getWeight } from "@/database/weight/get-weight";

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
    <AllDataTable data={weightData ?? []} isLoading={isLoading} error={error} />
  );
}
