import { useQuery } from "@tanstack/react-query";
import { getFullPlan } from "@/database/gym/plans/get-full-plan";

export default function useFullPlan(planId: string | undefined) {
  return useQuery({
    queryKey: ["full-training-plan", planId],
    queryFn: () => getFullPlan(planId!),
    enabled: !!planId,
  });
}
