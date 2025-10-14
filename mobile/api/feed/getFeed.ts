import { useInfiniteQuery } from "@tanstack/react-query";
import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 15;

async function fetchFeed({ pageParam = 1 }: { pageParam?: number }) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("No active Supabase session");
  }

  const url = `https://training-app-bay.vercel.app/api/feed?limit=${PAGE_SIZE}&page=${pageParam}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    handleError(new Error("Error fetching feed"), {
      message: "Error fetching feed",
      route: "/api/feed",
      method: "GET",
    });
    throw new Error("Error fetching feed");
  }

  const data = await res.json();

  return data;
}

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => fetchFeed({ pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    initialPageParam: 1,

    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
