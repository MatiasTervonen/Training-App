import { useQuery } from "@tanstack/react-query";
import { getGeneratedReport } from "@/database/reports/get-generated-report";

export default function useGeneratedReport(reportId: string | null) {
  return useQuery({
    queryKey: ["generated-report", reportId],
    queryFn: () => getGeneratedReport(reportId!),
    enabled: !!reportId,
  });
}
