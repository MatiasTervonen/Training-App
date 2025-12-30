import { handleError } from "@/app/(app)/utils/handleError";
import { feed_items } from "@/app/(app)/types/models";
import { createClient } from "@/utils/supabase/client";

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
  const supabase = createClient();
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
    feed_context: "pinned" as const,
  })) as unknown as FeedItemUI[];

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
