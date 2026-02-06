import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

export async function deleteActivityTemplate(templateId: string) {
  const supabase = createClient();

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
