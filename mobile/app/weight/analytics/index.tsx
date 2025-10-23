import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import AllDataTable from "@/components/weight-screen/AllDataTable";
import { getWeight } from "@/api/weight/get-weight";
import { weight } from "@/types/models";


export default function AnalyticsScreen() {
  const {
    data: weightData = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["weightData"],
    queryFn: async () => {
      const data = await getWeight();

      if (data.error) {
        throw new Error(data.message || "Error fetching weight data");
      }

      return data.weight as weight[];
    },

    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <View>
      <AllDataTable data={weightData} isLoading={isLoading} error={error} />
    </View>
  );
}
