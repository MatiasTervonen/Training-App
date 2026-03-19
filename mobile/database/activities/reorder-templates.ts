import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function reorderActivityTemplates(ids: string[]) {
  const { error } = await supabase.rpc("activities_reorder_templates", {
    p_ids: ids,
  });

  if (error) {
    handleError(error, {
      message: "Error reordering templates",
      route: "/database/activities/reorder-templates",
      method: "POST",
    });
    throw new Error("Error reordering templates");
  }
}
