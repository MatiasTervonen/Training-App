import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

export async function saveUserLanguage(language: "en" | "fi") {
  const supabase = createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("user_settings")
    .update({ language })
    .eq("user_id", user.sub);

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
