"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/utils/handleError";

const PAGE_SIZE = 15;

export async function getAllFeedback(offset: number) {
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

  const { data, error } = await supabase.rpc("get_all_feedback", {
    p_limit: PAGE_SIZE,
    p_offset: offset,
  });

  if (error) {
    handleError(error, {
      message: "Error fetching feedback",
      route: "/database/admin/get-feedback",
      method: "GET",
    });
    throw new Error("Error fetching feedback");
  }

  return (data ?? []) as FeedbackItem[];
}

// Re-exported for consumers
export type FeedbackItem = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  message: string;
  image_paths: string[];
  created_at: string;
  user_email: string;
  display_name: string;
};
