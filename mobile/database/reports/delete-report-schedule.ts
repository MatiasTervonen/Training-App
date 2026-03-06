import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deleteReportSchedule(scheduleId: string) {
  const { error } = await supabase.rpc("report_delete_schedule", {
    p_schedule_id: scheduleId,
  });

  if (error) {
    handleError(error, {
      message: "Error deleting report schedule",
      route: "/database/reports/delete-report-schedule",
      method: "DELETE",
    });
    throw new Error("Error deleting report schedule");
  }

  return { success: true };
}
