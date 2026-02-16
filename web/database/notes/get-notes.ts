import { handleError } from "@/utils/handleError";
import { createClient } from "@/utils/supabase/client";
import { FeedItemUI } from "@/types/session";

export type FolderFilter =
  | { type: "all" }
  | { type: "folder"; folderId: string };

export async function getNotes({
  pageParam = 0,
  limit = 10,
  folderFilter,
}: {
  pageParam?: number;
  limit?: number;
  folderFilter?: FolderFilter;
}): Promise<{
  feed: FeedItemUI[];
  nextPage: number | null;
}> {
  const supabase = createClient();
  const from = pageParam * limit;

  // When filtering by folder, use the RPC
  if (folderFilter && folderFilter.type !== "all") {
    const { data, error } = await supabase.rpc("notes_get_by_folder", {
      p_folder_id: folderFilter.folderId,
      p_unfiled_only: false,
      p_limit: limit,
      p_offset: from,
    });

    if (error) {
      handleError(error, {
        message: "Error fetching notes feed",
        route: "/database/notes/get-notes",
        method: "GET",
      });
      throw new Error("Error fetching notes feed");
    }

    const feed = (data ?? []).map((item) => ({
      ...item,
      feed_context: "feed" as const,
    })) as FeedItemUI[];

    const hasMore = (data?.length ?? 0) === limit;
    return { feed, nextPage: hasMore ? pageParam + 1 : null };
  }

  // Default: all notes with pinned support
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
