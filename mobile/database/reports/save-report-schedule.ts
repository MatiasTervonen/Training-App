import * as Localization from "expo-localization";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { ReportFeature, ScheduleType } from "@/types/report";

export async function saveReportSchedule({
  title,
  includedFeatures,
  scheduleType,
  deliveryDayOfWeek,
  deliveryDayOfMonth,
  deliveryHour,
}: {
  title: string;
  includedFeatures: ReportFeature[];
  scheduleType: ScheduleType;
  deliveryDayOfWeek: number | null;
  deliveryDayOfMonth: number | null;
  deliveryHour: number;
}): Promise<string> {
  const timezone = Localization.getCalendars()[0]?.timeZone ?? "UTC";

  const { data, error } = await supabase.rpc("report_save_schedule", {
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
      message: "Error saving report schedule",
      route: "/database/reports/save-report-schedule",
      method: "POST",
    });
    throw new Error("Error saving report schedule");
  }

  return data as string;
}
