import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getExercises({
  pageParam = 0,
  limit = 50,
  search = "",
}: {
  pageParam?: number;
  limit?: number;
  search?: string;
}) {
  const from = pageParam * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("gym_exercises")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);

  if (search.trim() !== "") {
    query = query.or(
      `name.ilike.%${search}%,equipment.ilike.%${search}%,muscle_group.ilike.%${search}%,main_group.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    handleError(error, {
      message: "Error fetching exercises",
      route: "/database/gym/get-exercises",
      method: "GET",
    });
    throw new Error("Error fetching exercises");
  }

  const hasMore = data && data.length === limit;

  return { data, nextPage: hasMore ? pageParam + 1 : undefined };
}
