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

  const now = new Date();
  const nowIso = now.toISOString();
  const next4hIso = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

  const remindersPromise =
    pageParam === 0
      ? supabase
          .from("reminders")
          .select("*")
          .gte("notify_at", nowIso)
          .lte("notify_at", next4hIso)
          .is("delivered", false)
          .order("notify_at", { ascending: true })
      : Promise.resolve({ data: [], error: null });

  const [pinnedResult, feedResult, remindersResult] = await Promise.all([
    pinnedPromise,
    feedPromise,
    remindersPromise,
  ]);

  if (pinnedResult.error || feedResult.error || remindersResult.error) {
    const error =
      pinnedResult.error || feedResult.error || remindersResult.error;

    handleError(error, {
      message: "Error fetching feed, reminders, or custom reminders",
      route: "server-action: getFeed",
      method: "direct",
    });
    throw new Error("Error fetching feed, reminders, or custom reminders");
  }

  const comingSoon = (remindersResult.data ?? []).map((item) => ({
    ...item,
    feed_context: "soon",
    type: "reminders",
  }));

  const pinned = (pinnedResult.data ?? []).map((item) => ({
    ...item,
    feed_context: "pinned",
  }));

  const page = (feedResult.data ?? []).map((item) => ({
    ...item,
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
