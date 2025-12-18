import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";
import { Feed_item } from "@/types/session";

export default async function getFeed({
  pageParam = 0,
  limit = 10,
}: {
  pageParam?: number;
  limit?: number;
}): Promise<{ feed: Feed_item[]; nextPage: number | null }> {
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

  const now = new Date();
  const nowIso = now.toISOString();
  const next4hIso = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

  const remindersPromise =
    pageParam === 0
      ? supabase
          .from("global_reminders")
          .select("*")
          .gte("notify_at", nowIso)
          .lte("notify_at", next4hIso)
          .is("seen_at", null)
          .order("notify_at", { ascending: true })
      : Promise.resolve({ data: [], error: null });

  const localRemindersPromise =
    pageParam === 0
      ? supabase
          .from("local_reminders")
          .select("*")
          .gte("notify_date", nowIso)
          .lte("notify_date", next4hIso)
          .is("seen_at", null)
          .order("notify_date", { ascending: true })
      : Promise.resolve({ data: [], error: null });

  const [pinnedResult, feedResult, remindersResult, localRemindersResult] =
    await Promise.all([
      pinnedPromise,
      feedPromise,
      remindersPromise,
      localRemindersPromise,
    ]);

  if (
    pinnedResult.error ||
    feedResult.error ||
    remindersResult.error ||
    localRemindersResult.error
  ) {
    const error =
      pinnedResult.error ||
      feedResult.error ||
      remindersResult.error ||
      localRemindersResult.error;
    console.log(error);
    handleError(error, {
      message:
        "Error fetching feed, reminders, or local reminders, or local reminders",
      route: "server-action: getFeed",
      method: "direct",
    });
    throw new Error(
      "Error fetching feed, reminders, or local reminders, or local reminders"
    );
  }

  const comingSoon = [
    ...(remindersResult.data ?? []).map((item) => ({
      ...item,
      feed_context: "soon",
      type: "global_reminders",
    })),
    ...(localRemindersResult.data ?? []).map((item) => ({
      ...item,
      feed_context: "soon",
      type: "local_reminders",
    })),
  ];

  const pinned = (pinnedResult.data ?? []).map((item) => ({
    ...item,
    type: item.type,
    feed_context: "pinned",
  }));

  const page = (feedResult.data ?? []).map((item) => ({
    ...item,
    type: item.type,
    feed_context: "feed",
  }));

  const comingSoonIds = new Set(comingSoon.map((i) => i.id));

  const pinnedWithoutComingSoon = pinned.filter(
    (item) => !comingSoonIds.has(item.id)
  );

  const feedWithoutComingSoon = page.filter(
    (item) => !comingSoonIds.has(item.id)
  );

  const feed = [
    ...comingSoon,
    ...pinnedWithoutComingSoon,
    ...feedWithoutComingSoon,
  ];

  const hasMore = (feedResult.data?.length ?? 0) === limit;

  return { feed, nextPage: hasMore ? pageParam + 1 : null };
}
