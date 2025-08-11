import { NextResponse } from "next/server";
import GetSession from "@/app/(app)/lib/getSession";
import GetPinned from "@/app/(app)/lib/getPinned";
import { pinned_item } from "../../types/models";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const { feed } = await GetSession({ limit, page });
    const { pinned } = await GetPinned();

    // Filter out feed items that are pinned to avoid duplicates
    const pinnedItemIds = new Set(pinned.map((p: pinned_item) => p.item_id));
    const filteredFeed = feed.filter((item) => !pinnedItemIds.has(item.id!));

    // Ensure pinned items use pinned: true
    const pinnedItems = pinned.map((item: pinned_item) => ({
      ...item,
      pinned: true, // Use pinned
    }));

    const feedItems = filteredFeed.map((item) => ({
      ...item,
      pinned: false,
    }));

    const feedWithPinned =
      page === 1 ? [...pinnedItems, ...feedItems] : feedItems;

    return NextResponse.json({
      feed: feedWithPinned,
      nextPage: feed.length === limit ? page + 1 : null,
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
