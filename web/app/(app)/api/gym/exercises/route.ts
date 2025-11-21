import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = (searchParams.get("search") || "").trim().toLowerCase();

  const limit = 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("gym_exercises")
    .select("id, user_id, name, equipment, muscle_group, main_group")
    .order("name", { ascending: true });

  if (search.trim() !== "") {
    query = query.or(
      `name.ilike.%${search}%,equipment.ilike.%${search}%,muscle_group.ilike.%${search}%,main_group.ilike.%${search}%`
    );
  }

  query = query.range(from, to);

  const { data: exercises, error } = await query;

  if (error) {
    handleError(error, {
      message: "Error fetching exercises",
      route: "/api/gym/exercises",
      method: "GET",
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const hasMore = exercises.length === limit;

  return new Response(
    JSON.stringify({
      data: exercises,
      nextPage: hasMore ? page + 1 : null,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
