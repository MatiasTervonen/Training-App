import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type props = {
  id: string;
  title: string | null | undefined;
  notes: string | null | undefined;
  weight: number | null | undefined;
};

export async function editWeight({ title, notes, weight, id }: props) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No session");
  }

  const { error: weightError, data: weightData } = await supabase
    .from("weight")
    .update({ title, notes, weight })
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (weightError) console.error("Supabase update error", weightError);

  if (weightError) {
    handleError(weightError, {
      message: "Error editing weight entry",
      route: "/api/weight/edit-weight",
      method: "GET",
    });
    throw new Error("Error editing weight entry");
  }

  return { success: true };
}
