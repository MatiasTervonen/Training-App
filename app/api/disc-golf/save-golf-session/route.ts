import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { randomUUID } from "crypto";

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
  const { courseName, holes, isPublic = false, type, duration } = body;

  const sessionId = randomUUID(); // same for all rows

  const rowsToInsert = [];

  for (const hole of holes) {
    for (const score of hole.scores) {
      rowsToInsert.push({
        session_id: sessionId,
        user_id: user.id,
        created_at: new Date().toISOString(),
        course_name: courseName,
        hole_number: hole.hole_number,
        strokes: score.strokes,
        fairway_hit: score.fairwayHit,
        c1_putt_made: score.c1made,
        c1_putt_attempted: score.c1attempted,
        c2_putt_made: score.c2made,
        c2_putt_attempted: score.c2attempted,
        is_public: isPublic,
        type,
        duration,
      });
    }
  }

  const { error } = await supabase
    .from("disc_golf_session_scores")
    .insert(rowsToInsert);

  if (error) {
    console.error("Supabase Insert Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, sessionId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
