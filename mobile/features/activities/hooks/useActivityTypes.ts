import { useQuery } from "@tanstack/react-query";
import { getActivityTypes } from "@/database/activities/myActivitySessions/get-activity-types";

export default function useActivityTypes() {
  const { data: activityTypes = [], isLoading } = useQuery({
    queryKey: ["activityTypes"],
    queryFn: getActivityTypes,
  });

  return { activityTypes, isLoading };
}
