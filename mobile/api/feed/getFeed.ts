import GetPinned from "./getPinned";
import GetSession from "./getSession";
import { Session } from "@supabase/supabase-js";

export async function GetFeed(session: Session) {
  try {
    const { feed } = await GetSession(session);
    const { pinned } = await GetPinned(session);

    const pinnedItems = new Set(
      pinned.map((item) => `${item.table}:${item.item_id}`)
    );

    return feed.map((item) => ({
      ...item,
      pinned: pinnedItems.has(`${item.table}:${item.item.id}`),
    }));
  } catch (error) {
    console.error("Error fetching feed:", error);
    return [];
  }
}
