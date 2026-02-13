import { handleError } from "@/utils/handleError";
import { ExerciseEntry } from "@/types/session";
import { createClient } from "@/utils/supabase/client";

type editGymSessionProps = {
  id: string;
  title: string;
  durationEdit: number;
  notes: string;
  exercises: ExerciseEntry[];
};

export async function editSession({
  exercises,
  notes,
  durationEdit,
  title,
  id,
}: editGymSessionProps) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("gym_edit_session", {
    p_exercises: exercises,
    p_notes: notes,
    p_duration: durationEdit,
    p_title: title,
    p_id: id,
    p_updated_at: new Date().toISOString(),
  });

  if (error) {
    handleError(error, {
      message: "Error updating session",
      route: "/database/gym/edit-session",
      method: "POST",
    });
    throw new Error("Error updating session");
  }

  return data;
}
