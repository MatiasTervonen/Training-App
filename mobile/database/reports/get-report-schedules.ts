import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { ReportSchedule } from "@/types/report";

export async function getReportSchedules(): Promise<ReportSchedule[]> {
  const { data, error } = await supabase.rpc("report_get_schedules");

  if (error) {
    handleError(error, {
      message: "Error fetching report schedules",
      route: "/database/reports/get-report-schedules",
      method: "GET",
    });
    throw new Error("Error fetching report schedules");
  }

  return (data ?? []) as ReportSchedule[];
}
