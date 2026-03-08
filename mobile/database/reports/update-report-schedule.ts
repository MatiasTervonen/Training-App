import * as Localization from "expo-localization";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { ReportFeature, ScheduleType } from "@/types/report";

export async function updateReportSchedule({
  scheduleId,
  title,
  includedFeatures,
  scheduleType,
  deliveryDayOfWeek,
  deliveryDayOfMonth,
  deliveryHour,
}: {
  scheduleId: string;
  title: string;
  includedFeatures: ReportFeature[];
  scheduleType: ScheduleType;
  deliveryDayOfWeek: number | null;
  deliveryDayOfMonth: number | null;
  deliveryHour: number;
}) {
  const timezone = Localization.getCalendars()[0]?.timeZone ?? "UTC";

  const { error } = await supabase.rpc("report_update_schedule", {
    p_schedule_id: scheduleId,
    p_title: title,
    p_included_features: includedFeatures,
    p_schedule_type: scheduleType,
    p_delivery_day_of_week: deliveryDayOfWeek ?? undefined,
    p_delivery_day_of_month: deliveryDayOfMonth ?? undefined,
    p_delivery_hour: deliveryHour,
    p_timezone: timezone,
  });

  if (error) {
    handleError(error, {
      message: "Error updating report schedule",
      route: "/database/reports/update-report-schedule",
      method: "POST",
    });
    throw new Error("Error updating report schedule");
  }

  return { success: true };
}
