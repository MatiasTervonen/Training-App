import { createClient } from "@/utils/supabase/server";
import { pinned_item } from "@/app/(app)/types/models";

export default async function GetPinned(): Promise<{
  pinned: pinned_item[];
  error: Error | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { pinned: [], error: authError || new Error("User not found") };
  }

  const { data: pinned, error } = await supabase
    .from("pinned_items")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Supabase Fetch Error:", error);
    return { pinned: [], error };
  }

  return { pinned, error: null };
}
