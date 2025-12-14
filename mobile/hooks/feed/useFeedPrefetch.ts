import { useEffect, useRef } from "react";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { getFullTodoSession } from "@/database/todo/get-full-todo";
import { getFullGymSession } from "@/database/gym/get-full-gym-session";
import GetFullCustomReminder from "@/database/reminders/get-full-custom-reminder";
import { Feed_item } from "@/types/session";

export type FeedPage = {
  feed: Feed_item[];
  nextPage: number | null;
};

export default function useFeedPrefetch(
  data: InfiniteData<FeedPage> | undefined | null
) {
  const queryClient = useQueryClient();

  // runs when feed finishes loading. Prefetch full sessions

  const hashPrefetched = useRef(false);

  useEffect(() => {
    if (!data || hashPrefetched.current) return;
    if (data.pages.length === 0) return;

    hashPrefetched.current = true;

    const firstPageFeed = data.pages[0].feed;

    firstPageFeed.forEach((f) => {
      if (f.type === "todo_lists") {
        queryClient.prefetchQuery({
          queryKey: ["fullTodoSession", f.id],
          queryFn: () => getFullTodoSession(f.id!),
          staleTime: Infinity,
          gcTime: Infinity,
        });
      }
    });

    firstPageFeed.forEach((f) => {
      if (f.type === "gym_sessions") {
        queryClient.prefetchQuery({
          queryKey: ["fullGymSession", f.id],
          queryFn: () => getFullGymSession(f.id!),
          staleTime: Infinity,
          gcTime: Infinity,
        });
      }
    });

    firstPageFeed.forEach((f) => {
      if (f.type === "custom_reminders") {
        queryClient.prefetchQuery({
          queryKey: ["fullCustomReminder", f.id],
          queryFn: () => GetFullCustomReminder(f.id!),
          staleTime: Infinity,
          gcTime: Infinity,
        });
      }
    });
  }, [data, queryClient]);
}
