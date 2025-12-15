import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type props = {
  id: string;
  title: string | null | undefined;
  notes: string | null | undefined;
  weight: number | null | undefined;
};

export async function editWeight({ title, notes, weight, id }: props) {
  const { error: weightError } = await supabase
    .from("weight")
    .update({ title, notes, weight })
    .eq("id", id);

  if (weightError) console.error("Supabase update error", weightError);

  if (weightError) {
    handleError(weightError, {
      message: "Error editing weight entry",
      route: "/database/weight/edit-weight",
      method: "GET",
    });
    throw new Error("Error editing weight entry");
  }

  return { success: true };
}
