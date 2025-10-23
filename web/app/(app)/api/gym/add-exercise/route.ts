import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();

  const { id, name, language, equipment, muscle_group, main_group } = body;

  const { data: exerciseData, error: exerciseError } = await supabase
    .from("gym_exercises")
    .insert([
      {
        id,
        name,
        language,
        equipment,
        muscle_group,
        main_group,
        user_id: user.sub,
      },
    ])
    .select()
    .single();

  if (exerciseError || !exerciseData) {
    handleError(exerciseError, {
      message: "Error adding new exercise",
      route: "/api/gym/add-exercise",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: exerciseError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, exercise: exerciseData }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
