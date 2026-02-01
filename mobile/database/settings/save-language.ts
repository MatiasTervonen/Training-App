import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveLanguage(language: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("user_settings")
    .update({ language })
    .eq("user_id", session.user.id);

  if (error) {
    console.error(error);
    handleError(error, {
      message: "Error updating language",
      route: "/database/settings/save-language.ts",
      method: "POST",
    });
    throw new Error("Error updating language");
  }

  return true;
}
