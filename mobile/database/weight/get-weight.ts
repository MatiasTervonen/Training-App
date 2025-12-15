import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getWeight() {
  const { error: weightError, data: weight } = await supabase
    .from("weight")
    .select("id,title, notes, weight, created_at")
    .order("created_at", { ascending: false });

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
