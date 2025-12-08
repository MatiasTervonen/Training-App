import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

export default async function getFeed({
  pageParam = 0,
  limit = 10,
}: {
  pageParam?: number;
  limit?: number;
}) {
  const from = pageParam * limit;
  const to = from + limit - 1;

  const pinnedPromise =
    pageParam === 0
      ? supabase
          .from("feed_with_pins")
          .select("*")
          .eq("pinned", true)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null });

  const feedPromise = supabase
    .from("feed_with_pins")
    .select("*")
    .eq("pinned", false)
    .order("created_at", { ascending: false })
    .range(from, to);

  const [pinnedResult, feedResult] = await Promise.all([
    pinnedPromise,
    feedPromise,
  ]);

  if (pinnedResult.error || feedResult.error) {
    const error = pinnedResult.error || feedResult.error;
    handleError(error, {
      message: "Error fetching feed",
      route: "server-action: getFeed",
      method: "direct",
    });
    throw new Error("Error fetching feed");
  }

  const feed = [...(pinnedResult.data ?? []), ...(feedResult.data ?? [])];

  const hasMore = (feedResult.data?.length ?? 0) === limit;

  return { feed, nextPage: hasMore ? pageParam + 1 : null };
}
