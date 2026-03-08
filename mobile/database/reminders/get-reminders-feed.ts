import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { FeedItemUI } from "@/types/session";

export type ReminderFilter = "upcoming" | "delivered";

export function getPinnedContext(): string {
  return "reminders";
}

export async function getRemindersFeed({
  pageParam = 0,
  limit = 10,
  filter,
}: {
  pageParam?: number;
  limit?: number;
  filter: ReminderFilter;
}): Promise<{
  feed: FeedItemUI[];
  nextPage: number | null;
}> {
  const from = pageParam * limit;
  const pinnedContext = getPinnedContext();

  const pinnedPromise =
    pageParam === 0
      ? supabase
          .from("pinned_items")
          .select(`feed_items(*)`)
          .eq("pinned_context", pinnedContext)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null });

  const feedPromise = supabase.rpc("reminders_get_feed", {
    p_tab: filter,
    p_limit: limit,
    p_offset: from,
  });

  const [pinnedResult, feedResult] = await Promise.all([
    pinnedPromise,
    feedPromise,
  ]);

  if (pinnedResult.error || feedResult.error) {
    const error = pinnedResult.error || feedResult.error;
    handleError(error, {
      message: "Error fetching reminders feed",
      route: "/database/reminders/get-reminders-feed",
      method: "GET",
    });
    throw new Error("Error fetching reminders feed");
  }

  const pinned = (pinnedResult.data ?? []).map((item) => ({
    ...item.feed_items,
    feed_context: "pinned",
  })) as unknown as FeedItemUI[];

  const pinnedIds = new Set(pinned.map((item) => item.id));

  const feed = [
    ...pinned,
    ...(feedResult.data ?? [])
      .filter((item) => !pinnedIds.has(item.id))
      .map((item) => ({
        ...item,
        feed_context: "feed" as const,
      })),
  ] as FeedItemUI[];

  const hasMore = (feedResult.data?.length ?? 0) === limit;

  return { feed, nextPage: hasMore ? pageParam + 1 : null };
}
