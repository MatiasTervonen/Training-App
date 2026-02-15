import { useQuery } from "@tanstack/react-query";
import AllDataTable from "@/features/weight/AllDataTable";
import { getWeight } from "@/database/weight/get-weight";

export default function AnalyticsScreen() {
  const {
    data: weightData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["get-weight"],
    queryFn: getWeight,
  });

  return (
    <AllDataTable data={weightData ?? []} isLoading={isLoading} error={error} />
  );
}
