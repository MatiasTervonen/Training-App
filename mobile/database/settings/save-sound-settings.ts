import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveSoundSettings(settings: {
  pb_sound_enabled?: boolean;
  rest_timer_sound_enabled?: boolean;
}) {
  const { error } = await supabase
    .from("user_settings")
    .update(settings);

  if (error) {
    handleError(error, {
      message: "Error updating sound settings",
      route: "/database/settings/save-sound-settings.ts",
      method: "POST",
    });
    throw new Error("Error updating sound settings");
  }

  return true;
}
