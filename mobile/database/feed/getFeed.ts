import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";
import { feed_items } from "@/types/models";

export type FeedItemUI = feed_items & {
  feed_context: "pinned" | "feed";
};

export default async function getFeed({
  pageParam = 0,
  limit = 10,
}: {
  pageParam?: number;
  limit?: number;
}): Promise<{
  feed: FeedItemUI[];
  nextPage: number | null;
}> {
  const from = pageParam * limit;

  const pinnedPromise =
    pageParam === 0
      ? supabase
          .from("pinned_items")
          .select(`feed_items(*)`)
          .eq("pinned_context", "main")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null });

  const feedPromise = supabase.rpc("get_feed_sorted", {
    p_limit: limit,
    p_offset: from,
  });

  const [pinnedResult, feedResult] = await Promise.all([
    pinnedPromise,
    feedPromise,
  ]);

  if (pinnedResult.error || feedResult.error) {
    const error = pinnedResult.error || feedResult.error;
    console.error("Error fetching feed:", error);
    handleError(error, {
      message: "Error fetching feed",
      route: "server-action: getFeed",
      method: "direct",
    });
    throw new Error(
      "Error fetching feed, reminders, or local reminders, or local reminders",
    );
  }

  const pinned = (pinnedResult.data ?? []).map((item) => ({
    ...item.feed_items,
    feed_context: "pinned" as const,
  }));

  const pinnedIds = new Set(pinned.map((item) => item.id));

  const feed = [
    ...pinned,
    ...feedResult.data
      .filter((i) => !pinnedIds.has(i.id))
      .map((item) => ({
        ...item,
        feed_context: "feed" as const,
      })),
  ];

  const hasMore = (feedResult.data?.length ?? 0) === limit;

  return { feed, nextPage: hasMore ? pageParam + 1 : null };
}
