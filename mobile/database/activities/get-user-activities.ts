import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getUserActivities() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("activities")
    .select("id, name, base_met, category_id, activity_categories(id, name)")
    .order("name", { ascending: true })
    .eq("user_id", session.user.id);

  if (error) {
    handleError(error, {
      message: "Error fetching user activities",
      route: "/database/activities/get-user-activities",
      method: "GET",
    });
    throw new Error("Error fetching user activities");
  }

  return data ?? [];
}

export type UserActivity = Awaited<ReturnType<typeof getUserActivities>>[number];
