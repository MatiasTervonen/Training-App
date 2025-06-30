import { NextResponse } from "next/server";
import GetSession from "@/app/(app)/lib/getSession";
import GetPinned from "@/app/(app)/lib/getPinned";


export async function GET() {
  try {
    const { feed } = await GetSession();
    const { pinned } = await GetPinned();

    const pinnedItems = new Set(
      pinned.map((item) => `${item.table}:${item.item_id}`)
    );

    const feedWithPinned = feed.map((item) => ({
      ...item,
      pinned: pinnedItems.has(`${item.table}:${item.item.id}`),
    }));

    return NextResponse.json(feedWithPinned);
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}