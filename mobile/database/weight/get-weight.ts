import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getWeight() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error: weightError, data: weight } = await supabase
    .from("weight")
    .select("id,title, notes, weight, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true });


  if (weightError || !weight) {
    handleError(weightError, {
      message: "Error fetching weight entries",
      route: "/database/weight/get-weight",
      method: "GET",
    });
    throw new Error("Error fetching weight entries");
  }

  return weight;
}
