import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type props = {
  id: string;
  title: string | null | undefined;
  notes: string | null | undefined;
  weight: number | null | undefined;
  updated_at: string;
};

export async function editWeight({
  title,
  notes,
  weight,
  id,
  updated_at,
}: props) {
  const { data, error } = await supabase.rpc("weight_edit_weight", {
    p_id: id,
    p_title: title,
    p_notes: notes,
    p_weight: weight,
    p_updated_at: updated_at,
  });

  if (error) {
    handleError(error, {
      message: "Error editing weight",
      route: "/database/weight/edit-weight",
      method: "POST",
    });
    throw new Error("Error editing weight");
  }

  return data;
}
