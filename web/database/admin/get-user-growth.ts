"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/utils/handleError";

export type UserGrowthRow = {
  day: string;
  cumulative_users: number;
  new_users: number;
};

export async function getUserGrowth(days: number = 30): Promise<UserGrowthRow[]> {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const user = authData?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const role = user.app_metadata?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const { data, error } = await supabase.rpc("get_admin_user_growth", {
    p_days: days,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching user growth",
      route: "/database/admin/get-user-growth",
      method: "GET",
    });
    throw new Error("Error fetching user growth");
  }

  return (data ?? []) as UserGrowthRow[];
}
