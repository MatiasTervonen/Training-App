// Always filter feed_items by user_id — RLS OR's the "own items" and
// "friends shared items" policies together, so without an explicit
// user_id filter, friend's shared sessions leak into personal feeds.
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { FeedItemUI } from "@/types/session";

export function getActivityPinnedContext(activitySlug?: string): string {
  if (!activitySlug) return "activities";
  return `activities:type:${activitySlug}`;
}

export async function getActivitySessions({
  pageParam = 0,
  limit = 10,
  activitySlug,
}: {
  pageParam?: number;
  limit?: number;
  activitySlug?: string;
}): Promise<{
  feed: FeedItemUI[];
  nextPage: number | null;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.id;

  const from = pageParam * limit;
  const to = from + limit - 1;
  const pinnedContext = getActivityPinnedContext(activitySlug);

  let pinnedPromise;
  if (pageParam === 0) {
    const q = supabase
      .from("pinned_items")
      .select(`feed_items(*)`)
      .eq("pinned_context", pinnedContext)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    pinnedPromise = q;
  } else {
    pinnedPromise = Promise.resolve({ data: [], error: null });
  }

  const feedQuery = supabase
    .from("feed_items")
    .select("*")
    .eq("type", "activity_sessions")
    .eq("user_id", userId);

  if (activitySlug) {
    feedQuery.eq("extra_fields->>activity_slug", activitySlug);
  }

  const feedPromise = feedQuery
    .order("activity_at", { ascending: false })
    .range(from, to);

  const [pinnedResult, feedResult] = await Promise.all([
    pinnedPromise,
    feedPromise,
  ]);

  if (pinnedResult.error || feedResult.error) {
    const error = pinnedResult.error || feedResult.error;

    handleError(error, {
      message: "Error fetching activity feed",
      route: "server-action: getActivitySessions",
      method: "direct",
    });
    throw new Error("Error fetching activity feed");
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
