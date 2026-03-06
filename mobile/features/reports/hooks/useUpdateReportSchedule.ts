import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateReportSchedule } from "@/database/reports/update-report-schedule";

export default function useUpdateReportSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateReportSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-schedules"] });
    },
  });
}
