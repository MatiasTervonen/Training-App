"use client";

import { FeedItemUI } from "@/types/session";
import { useQuery } from "@tanstack/react-query";
import { getFullGymSession } from "@/database/gym/get-full-gym-session";
import { getFullTodoSession } from "@/database/todo/get-full-todo";
import {
  full_todo_session,
  FullActivitySession,
} from "@/types/models";
import { FullGymSession } from "@/database/gym/get-full-gym-session";
import { getFullActivitySession } from "@/database/activities/get-full-activity-session";

export default function useFullSessions(
  expandedItem: FeedItemUI | null,
  editingItem: FeedItemUI | null,
) {
  const getId = (fi: FeedItemUI | null) => fi?.source_id ?? null;

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

  const activityItem =
    expandedItem?.type === "activity_sessions"
      ? expandedItem
      : editingItem?.type === "activity_sessions"
        ? editingItem
        : null;

  const activityId = activityItem ? getId(activityItem) : null;

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
  } = useQuery<FullGymSession>({
    queryKey: ["fullGymSession", gymId],
    queryFn: async () => await getFullGymSession(gymId!),
    enabled: !!gymId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const {
    data: TodoSessionFull,
    error: TodoSessionError,
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
    refetch: refetchFullActivity,
  } = useQuery<FullActivitySession & { feed_context: "pinned" | "feed" }>({
    queryKey: ["fullActivitySession", activityId],
    queryFn: async () => {
      const data = await getFullActivitySession(activityId!);
      return { ...data, feed_context: activityItem!.feed_context };
    },
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
    TodoSessionFull,
    TodoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
    activitySessionFull,
    activitySessionError,
    isLoadingActivitySession,
    refetchFullActivity,
  };
}
