import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { TemplateHistorySession } from "@/types/session";

export async function getTemplateHistory(
  templateId: string,
): Promise<TemplateHistorySession[]> {
  const { data, error } = await supabase.rpc(
    "activities_get_template_history",
    { p_template_id: templateId },
  );

  if (error) {
    handleError(error, {
      message: "Error fetching template history",
      route: "/database/activities/get-template-history",
      method: "GET",
    });
    throw new Error("Error fetching template history");
  }

  return (data ?? []) as TemplateHistorySession[];
}
