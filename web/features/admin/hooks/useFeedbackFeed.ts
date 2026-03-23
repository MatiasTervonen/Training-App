"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getAllFeedback } from "@/database/admin/get-feedback";
import type { FeedbackItem } from "@/database/admin/get-feedback";

const PAGE_SIZE = 15;

export default function useFeedbackFeed() {
  const query = useInfiniteQuery<FeedbackItem[]>({
    queryKey: ["admin-feedback"],
    queryFn: ({ pageParam = 0 }) => getAllFeedback(pageParam as number),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
  });

  const items = query.data?.pages.flat() ?? [];

  return {
    ...query,
    items,
  };
}
