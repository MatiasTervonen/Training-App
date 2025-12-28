import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type props = {
  title: string;
  notes: string;
  weight: number | undefined;
};

export async function saveWeight({ title, notes, weight }: props) {
  const { error } = await supabase.rpc("weight_save_weight", {
    p_title: title,
    p_notes: notes,
    p_weight: weight,
  });

  if (error) {
    handleError(error, {
      message: "Error saving weight",
      route: "/database/weight/save-weight",
      method: "POST",
    });
    throw new Error("Error saving weight");
  }

  return true;
}
