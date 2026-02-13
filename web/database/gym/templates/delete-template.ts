import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function deleteTemplate(templateId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("gym_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    handleError(error, {
      message: "Error deleting template",
      route: "/database/gym/templates/delete-template",
      method: "POST",
    });
    throw new Error("Error deleting template");
  }

  return { success: true };
}
