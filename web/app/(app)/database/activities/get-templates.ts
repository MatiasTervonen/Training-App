import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";
import { templateSummary } from "@/app/(app)/types/models";

export async function getActivityTemplates(): Promise<templateSummary[]> {
  const supabase = createClient();

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
