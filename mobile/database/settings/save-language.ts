import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveLanguage(language: string) {
  const { error } = await supabase
    .from("user_settings")
    .update({ language });

  if (error) {
    handleError(error, {
      message: "Error updating language",
      route: "/database/settings/save-language.ts",
      method: "POST",
    });
    throw new Error("Error updating language");
  }

  return true;
}
