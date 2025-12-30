import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/app/(app)/utils/handleError";

export async function getWeight() {
  const supabase = createClient();

  const { data: weight, error: weightError } = await supabase
    .from("weight")
    .select("*")
    .order("created_at", { ascending: true });

  if (weightError || !weight) {
    handleError(weightError, {
      message: "Error fetching weight entries",
      route: "server-action: getWeight",
      method: "direct",
    });
    throw new Error("Unauthorized");
  }

  return weight;
}
