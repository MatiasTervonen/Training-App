import { createClient } from "@/utils/supabase/server";

type PinnedItem =
  | { table: "notes"; item_id: string }
  | { table: "gym_sessions"; item_id: string };

export default async function GetPinned(): Promise<{
  pinned: PinnedItem[];
  error: Error | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log("Authentication error:", authError);
    return { pinned: [], error: authError || new Error("User not found") };
  }

  const { data, error } = await supabase
    .from("pinned_items")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Supabase Fetch Error:", error);
    return { pinned: [], error };
  }

  const pinned = data.map((item) => ({
    table: item.table,
    item_id: item.item_id,
  }));

  return { pinned, error: null };
}
