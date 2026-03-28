import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export async function saveUserLanguage(language: "en" | "fi") {
  const supabase = createClient();

  const { error } = await supabase.from("user_settings").update({ language });

  if (error) {
    handleError(error, {
      message: "Error saving user language",
      route: "/database/settings/save-user-language",
      method: "POST",
    });
    throw new Error("Error saving user language");
  }

  return true;
}
