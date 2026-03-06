import { useQuery } from "@tanstack/react-query";
import { getReportSchedules } from "@/database/reports/get-report-schedules";

export default function useReportSchedules() {
  return useQuery({
    queryKey: ["report-schedules"],
    queryFn: getReportSchedules,
  });
}
