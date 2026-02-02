import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/client";
import { FeedItemUI } from "@/app/(app)/types/session";

export async function getNotes({
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
          .eq("pinned_context", "notes")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null });

  const feedPromise = supabase
    .from("feed_items")
    .select(
      `
    id,
    title,
    source_id,
    activity_at,
    created_at,
    updated_at,
    occurred_at,
    type,
    extra_fields
`
    )
    .eq("type", "notes")
    .order("activity_at", { ascending: false })
    .range(from, to);

  const [pinnedResult, feedResult] = await Promise.all([
    pinnedPromise,
    feedPromise,
  ]);

  if (pinnedResult.error || feedResult.error) {
    const error = pinnedResult.error || feedResult.error;

    handleError(error, {
      message: "Error fetching notes feed",
      route: "server-action: getNotes",
      method: "direct",
    });
    throw new Error("Error fetching notes feed");
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
        feed_context: "feed" as const,
      })),
  ] as FeedItemUI[];

  const hasMore = (feedResult.data?.length ?? 0) === limit;

  return { feed, nextPage: hasMore ? pageParam + 1 : null };
}
