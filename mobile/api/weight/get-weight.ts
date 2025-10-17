import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getWeight() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    return { error: true, message: "No session" };
  }

  const { error: weightError, data: weight } = await supabase
    .from("weight")
    .select("id,title, notes, weight, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true });

  if (weightError || !weight) {
    handleError(weightError, {
      message: "Error fetching weight entries",
      route: "/api/weight/get-weight",
      method: "GET",
    });
    return { error: true, message: "Error fetching weight entries" };
  }

  return { weight };
}
