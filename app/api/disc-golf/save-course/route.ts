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
  const { name } = body;

    const { data, error } = await supabase.from("disc_golf_courses").insert([
        {
        name,
        created_at: new Date().toISOString(),
        },
    ]);

    if (error) {
        console.error("Supabase Insert Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
        });
    }


    return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
