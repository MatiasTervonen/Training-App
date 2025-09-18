import { Feed_item } from "@/app/(app)/types/session";

type FeedItem = {
  table: "notes" | "weight" | "gym_sessions";
  item: Feed_item;
  pinned: boolean;
};

type PageData = {
  feed: FeedItem[];
  nextPage: number | null;
};

const PAGE_SIZE = 15;

export const getFeedKey = (
  pageIndex: number,
  previousPageData: PageData | null
) => {
  if (previousPageData && !previousPageData.nextPage) return null;
  return `/api/feed?limit=${PAGE_SIZE}&page=${pageIndex + 1}`;
};
