import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function GET() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("friends")
    .select("id, user1_id, user2_id")
    .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);

  if (error) {
    handleError(error, {
      message: "Error fetching friends",
      route: "/database/friend/get-friends",
      method: "GET",
    });
    throw new Error("Error fetching friends");
  }

  return data;
}
