import { FeedItemUI } from "@/types/session";
import { useQuery } from "@tanstack/react-query";
import { getFullGymSession } from "@/database/gym/get-full-gym-session";
import { getFullTodoSession } from "@/database/todo/get-full-todo";
import {
  full_gym_session,
  full_todo_session,
  FullActivitySession,
} from "@/types/models";
import { getFullActivitySession } from "@/database/activities/get-full-activity-session";

const getId = (fi: FeedItemUI | null) => fi?.source_id ?? null;

export default function useFullSessions(
  expandedItem: FeedItemUI | null,
  editingItem: FeedItemUI | null
) {
  const expandedId = getId(expandedItem);
  const editingId = getId(editingItem);

  const gymId =
    expandedItem?.type === "gym_sessions"
      ? expandedId
      : editingItem?.type === "gym_sessions"
        ? editingId
        : null;

  const todoId =
    expandedItem?.type === "todo_lists"
      ? expandedId
      : editingItem?.type === "todo_lists"
        ? editingId
        : null;

  const activityId =
    expandedItem?.type === "activity_sessions"
      ? expandedId
      : editingItem?.type === "activity_sessions"
        ? editingId
        : null;

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
  } = useQuery<full_gym_session>({
    queryKey: ["fullGymSession", gymId],
    queryFn: () => getFullGymSession(gymId!),
    enabled: !!gymId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const {
    data: todoSessionFull,
    error: todoSessionError,
    isLoading: isLoadingTodoSession,
    refetch: refetchFullTodo,
  } = useQuery<full_todo_session>({
    queryKey: ["fullTodoSession", todoId],
    queryFn: async () => await getFullTodoSession(todoId!),
    enabled: !!todoId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const {
    data: activitySessionFull,
    error: activitySessionError,
    isLoading: isLoadingActivitySession,
  } = useQuery<FullActivitySession>({
    queryKey: ["fullActivitySession", activityId],
    queryFn: async () => await getFullActivitySession(activityId!),
    enabled: !!activityId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    GymSessionFull,
    GymSessionError,
    isLoadingGymSession,
    todoSessionFull,
    todoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
    activitySessionFull,
    activitySessionError,
    isLoadingActivitySession,
  };
}
