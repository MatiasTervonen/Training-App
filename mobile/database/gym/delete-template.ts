import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export default async function DeleteTemplate(templateId: string) {
  const { error } = await supabase
    .from("gym_templates")
    .delete()
    .eq("id", templateId)

  if (error) {
    handleError(error, {
      message: "Error deleting template",
      route: "/database/gym/delete-template",
      method: "POST",
    });
    throw new Error("Error deleting template");
  }

  return { success: true };
}
