import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function saveTemplate({
  name,
  notes,
  sessionId,
}: {
  name: string;
  notes: string;
  sessionId: string;
}) {
  const { data, error } = await supabase.rpc("activities_save_template", {
    p_name: name,
    p_notes: notes,
    p_session_id: sessionId,
  });

  if (error) {
    handleError(error, {
      message: "Error saving template",
      route: "/database/activities/save-template",
      method: "POST",
    });
    throw new Error("Error saving template");
  }

  return data;
}
