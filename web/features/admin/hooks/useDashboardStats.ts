"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, DashboardStats } from "@/database/admin/get-dashboard-stats";
import { getUserGrowth, UserGrowthRow } from "@/database/admin/get-user-growth";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => getDashboardStats(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useUserGrowth(days: number) {
  return useQuery<UserGrowthRow[]>({
    queryKey: ["admin-user-growth", days],
    queryFn: () => getUserGrowth(days),
    refetchOnWindowFocus: false,
  });
}
