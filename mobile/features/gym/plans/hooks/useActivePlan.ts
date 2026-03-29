import { useQuery } from "@tanstack/react-query";
import { getCurrentPlan } from "@/database/gym/plans/get-current-plan";

export default function useActivePlan() {
  return useQuery({
    queryKey: ["active-training-plan"],
    queryFn: getCurrentPlan,
  });
}
