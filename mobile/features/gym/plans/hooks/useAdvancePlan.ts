import { advancePlan } from "@/database/gym/plans/advance-plan";
import { useQueryClient } from "@tanstack/react-query";

export default function useAdvancePlan() {
  const queryClient = useQueryClient();

  const handleAdvancePlan = async (planId: string) => {
    const result = await advancePlan(planId);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["active-training-plan"], exact: true }),
      queryClient.invalidateQueries({ queryKey: ["training-plans"], exact: true }),
    ]);

    return result;
  };

  return { handleAdvancePlan };
}
