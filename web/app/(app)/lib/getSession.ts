import { createClient } from "@/utils/supabase/server";
import { feed_view } from "@/app/(app)/types/models";

export default async function GetSession({
  limit = 10,
  page = 1,
}: {
  limit?: number;
  page?: number;
}): Promise<{
  feed: feed_view[];
  error: Error | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { feed: [], error: authError || new Error("User not found") };
  }

  const offset = (page - 1) * limit;

  const { error, data: feed } = await supabase
    .from("feed_view4")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { feed: [], error };
  }

  return { feed, error: null };
}
