"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/utils/handleError";

export type DashboardStats = {
  active_5m: number;
  active_15m: number;
  active_1h: number;
  active_24h: number;
  total_users: number;
  web_active: number;
  mobile_active: number;
  new_today: number;
  new_this_week: number;
  new_this_month: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
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

  const { data, error } = await supabase.rpc("get_admin_dashboard_stats");

  if (error) {
    handleError(error, {
      message: "Error fetching dashboard stats",
      route: "/database/admin/get-dashboard-stats",
      method: "GET",
    });
    throw new Error("Error fetching dashboard stats");
  }

  return data as DashboardStats;
}
