import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getTodoSessions, TodoFilter } from "@/database/todo/get-todo-sessions";
import { FeedData } from "@/types/session";
import { useEffect, useMemo } from "react";

export default function useMyTodoFeed(filter: TodoFilter = "all") {
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => {
    if (filter === "all") return ["myTodoLists"];
    return ["myTodoLists", filter];
  }, [filter]);

  const {
    data,
    error,
    isLoading,
    refetch: mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) =>
      getTodoSessions({ pageParam, limit: 10, filter }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Keep only first page in cache when user leaves feed

  useEffect(() => {
    return () => {
      queryClient.setQueryData<FeedData>(queryKey, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.slice(0, 1),
          pageParams: old.pageParams.slice(0, 1),
        };
      });
    };
  }, [queryClient, queryKey]);

  const { pinnedFeed, unpinnedFeed } = useMemo(() => {
    const pinned: NonNullable<typeof data>["pages"][0]["feed"] = [];
    const unpinned: typeof pinned = [];
    data?.pages.forEach((page) => {
      for (const item of page.feed) {
        if (item.feed_context === "pinned") pinned.push(item);
        else unpinned.push(item);
      }
    });
    return { pinnedFeed: pinned, unpinnedFeed: unpinned };
  }, [data]);

  return {
    data,
    error,
    isLoading,
    mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    pinnedFeed,
    unpinnedFeed,
    queryKey,
  };
}
