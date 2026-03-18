import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getWeight() {
  const { error: weightError, data: weight } = await supabase
    .from("weight")
    .select("id, title, notes, weight, created_at, weight_images(count), weight_videos(count), weight_voice(count)")
    .order("created_at", { ascending: false });

  if (weightError || !weight) {
    handleError(weightError, {
      message: "Error fetching weight entries",
      route: "/database/weight/get-weight",
      method: "GET",
    });
    throw new Error("Error fetching weight entries");
  }

  return weight.map((entry) => ({
    id: entry.id,
    title: entry.title,
    notes: entry.notes,
    weight: entry.weight,
    created_at: entry.created_at,
    has_media:
      ((entry.weight_images as unknown as { count: number }[])?.[0]?.count ?? 0) +
      ((entry.weight_videos as unknown as { count: number }[])?.[0]?.count ?? 0) +
      ((entry.weight_voice as unknown as { count: number }[])?.[0]?.count ?? 0) > 0,
  }));
}
