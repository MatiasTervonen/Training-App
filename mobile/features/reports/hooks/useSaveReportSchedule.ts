import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveReportSchedule } from "@/database/reports/save-report-schedule";

export default function useSaveReportSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveReportSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-schedules"] });
    },
  });
}
