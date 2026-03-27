"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getFoodReports } from "@/database/admin/get-food-reports";
import type { FoodReportItem } from "@/database/admin/get-food-reports";

const PAGE_SIZE = 15;

export default function useFoodReports(status?: string) {
  const query = useInfiniteQuery<FoodReportItem[]>({
    queryKey: ["admin-food-reports", status],
    queryFn: ({ pageParam = 0 }) =>
      getFoodReports(pageParam as number, status),
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
