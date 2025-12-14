"use client";

import { FeedItem } from "@/app/(app)/types/models";
import { useQuery } from "@tanstack/react-query";
import { getFullGymSession } from "@/app/(app)/database/gym";
import { getFullTodoSession } from "@/app/(app)/database/todo";
import { getFullCustomReminder } from "@/app/(app)/database/reminder";
import { full_gym_session, full_todo_session } from "@/app/(app)/types/models";

export default function useFullSessions(
  expandedItem: FeedItem | null,
  editingItem: FeedItem | null
) {
  const getId = (fi: FeedItem | null) => fi?.item.id ?? null;

  const expandedId = getId(expandedItem);
  const editingId = getId(editingItem);

  const gymId =
    expandedItem?.table === "gym_sessions"
      ? expandedId
      : editingItem?.table === "gym_sessions"
      ? editingId
      : null;

  const customReminderId =
    expandedItem?.table === "custom_reminders"
      ? expandedId
      : editingItem?.table === "custom_reminders"
      ? editingId
      : null;

  const todoId =
    expandedItem?.table === "todo_lists"
      ? expandedId
      : editingItem?.table === "todo_lists"
      ? editingId
      : null;

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
  } = useQuery<full_gym_session>({
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
    data: CustomReminderFull,
    error: CustomReminderError,
    isLoading: isLoadingCustomReminder,
  } = useQuery({
    queryKey: ["fullCustomReminder", customReminderId],
    queryFn: () => getFullCustomReminder(customReminderId!),
    enabled: !!customReminderId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
    CustomReminderFull,
    CustomReminderError,
    isLoadingCustomReminder,
  };
}
