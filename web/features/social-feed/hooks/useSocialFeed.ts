"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getFriendsFeed, PAGE_SIZE } from "@/database/social-feed/get-friends-feed";
import { SocialFeedItem } from "@/types/social-feed";

export default function useSocialFeed() {
  const query = useInfiniteQuery<SocialFeedItem[]>({
    queryKey: ["social-feed"],
    queryFn: ({ pageParam = 0 }) => getFriendsFeed(pageParam as number),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });

  const items = query.data?.pages.flat() ?? [];

  return {
    ...query,
    items,
  };
}
