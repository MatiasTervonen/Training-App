"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

export async function getUsers({
  pageParam,
  limit,
}: {
  pageParam: number;
  limit: number;
}) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

    // Check if the user has admin privileges
    const role = user.app_metadata?.role;
    if (role !== "admin" && role !== "super_admin") {
      throw new Error("Forbidden");
    }

  const from = pageParam * limit;
  const to = from + limit - 1;

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (usersError || !users) {
    handleError(usersError, {
      message: "Error fetching users",
      route: "server_action: getUsers",
      method: "direct",
    });
    throw new Error("Unauthorized");
  }

  return users;
}
