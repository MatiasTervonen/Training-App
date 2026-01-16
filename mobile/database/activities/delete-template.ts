import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function deleteActivityTemplate(templateId: string) {
  const { error } = await supabase
    .from("activity_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    handleError(error, {
      message: "Error deleting activity template",
      route: "/database/activities/delete-template",
      method: "POST",
    });
    throw new Error("Error deleting activity template");
  }

  return { success: true };
}
