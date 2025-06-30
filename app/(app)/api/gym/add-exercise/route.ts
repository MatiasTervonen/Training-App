import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

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
      },
    ])
    .select()
    .single();

  if (exerciseError || !exerciseData) {
    console.error("Supabase Insert Error:", exerciseError);
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
