import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export default async function DeleteTemplate(templateId: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("gym_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", session.user.id);

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
