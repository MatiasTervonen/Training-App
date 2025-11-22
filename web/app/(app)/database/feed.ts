"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";


export default async function getFeed({
  pageParam = 0,
  limit = 10,
}: {
  pageParam?: number;
  limit?: number;
}) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const from = pageParam * limit;
  const to = from + limit - 1;

  const pinnedPromise =
    pageParam === 0
      ? supabase
          .from("feed_with_pins")
          .select("*")
          .eq("pinned", true)
          .eq("user_id", user.sub)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null });

  const feedPromise = supabase
    .from("feed_with_pins")
    .select("*")
    .eq("pinned", false)
    .eq("user_id", user.sub)
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

type DeleteSessionProps = {
  id: string;
  table: "notes" | "gym_sessions" | "weight" | "todo_lists" | "reminders";
};

export async function deleteSession({ id, table }: DeleteSessionProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: tableError } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", user.sub);

  if (tableError) {
    handleError(tableError, {
      message: "Error deleting session",
      route: "server-action: deleteSession",
      method: "direct",
    });
    throw new Error("Error deleting session");
  }

  const { error: pinnedError } = await supabase
    .from("pinned_items")
    .delete()
    .eq("item_id", id)
    .eq("type", table)
    .eq("user_id", user.sub);

  if (pinnedError) {
    handleError(pinnedError, {
      message: "Error deleting pinned item",
      route: "server-action: deleteSession",
      method: "direct",
    });
    throw new Error("Error deleting pinned item");
  }

  return { success: true };
}
