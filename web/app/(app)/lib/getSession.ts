import { createClient } from "@/utils/supabase/server";
import { feed_view } from "@/app/(app)/types/models";
import { handleError } from "@/app/(app)/utils/handleError";

export default async function GetSession({
  limit = 10,
  page = 1,
}: {
  limit?: number;
  page?: number;
}): Promise<{
  feed: feed_view[];
  nextPage: number | null;
  error: Error | null;
}> {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (authError || !user) {
    return {
      feed: [],
      nextPage: null,
      error: authError || new Error("User not found"),
    };
  }

  const offset = (page - 1) * limit;

  const pinnedPromise =
    page === 1
      ? supabase
          .from("feed_with_pins")
          .select("*")
          .eq("user_id", user.sub)
          .eq("pinned", true)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null });

  const feedPromise = supabase
    .from("feed_with_pins")
    .select("*")
    .eq("pinned", false)
    .eq("user_id", user.sub)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const [pinnedResult, feedResult] = await Promise.all([
    pinnedPromise,
    feedPromise,
  ]);

  if (pinnedResult.error || feedResult.error) {
    const error = pinnedResult.error || feedResult.error;
    handleError(error, { message: "Error fetching feed", method: "GET" });
    return { feed: [], nextPage: null, error };
  }

  const unpinnedCount = feedResult.data?.length ?? 0;
  const nextPage = unpinnedCount >= limit ? page + 1 : null;

  const feed = [...(pinnedResult.data ?? []), ...(feedResult.data ?? [])];

  return { feed, nextPage, error: null };
}
