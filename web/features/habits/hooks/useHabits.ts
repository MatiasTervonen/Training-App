import { useQuery } from "@tanstack/react-query";
import { getHabits } from "@/database/habits/get-habits";

export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: getHabits,
  });
}
