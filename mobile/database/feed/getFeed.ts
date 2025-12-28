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
  const to = from + limit - 1;

  const pinnedPromise =
    pageParam === 0
      ? supabase
          .from("pinned_items")
          .select(`feed_items(*)`)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null });

  const feedPromise = supabase
    .from("feed_items")
    .select("*")
    .order("occurred_at", { ascending: false })
    .range(from, to);

  // const now = new Date();
  // const nowIso = now.toISOString();
  // const next4hIso = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

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
    throw new Error(
      "Error fetching feed, reminders, or local reminders, or local reminders"
    );
  }

  const pinned = (pinnedResult.data ?? []).map((item) => ({
    ...item.feed_items,
    feed_context: "pinned",
  })) as unknown as FeedItemUI[];

  const pinnedIds = new Set(pinned.map((item) => item.id));

  const feed = [
    ...pinned,
    ...feedResult.data
      .filter((i) => !pinnedIds.has(i.id))
      .map((item) => ({
        ...item,
        feed_context: "feed",
      })),
  ];

  const hasMore = (feedResult.data?.length ?? 0) === limit;

  return { feed, nextPage: hasMore ? pageParam + 1 : null };
}
