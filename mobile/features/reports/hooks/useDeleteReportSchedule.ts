import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteReportSchedule } from "@/database/reports/delete-report-schedule";

export default function useDeleteReportSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReportSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-schedules"] });
    },
  });
}
