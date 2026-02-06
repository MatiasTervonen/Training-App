import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { templateSummary } from "@/types/session";

export async function getActivityTemplates(): Promise<templateSummary[]> {
  const { data, error } = await supabase.rpc("activities_get_templates");

  if (error) {
    handleError(error, {
      message: "Error fetching templates",
      route: "/database/activities/get-templates",
      method: "GET",
    });
    throw new Error("Error fetching templates");
  }

  return (data ?? []) as templateSummary[];
}
