import { full_reminder } from "@/types/session";
import { useQuery } from "@tanstack/react-query";
import { getFullGymSession } from "@/database/gym/get-full-gym-session";
import { getFullTodoSession } from "@/database/todo/get-full-todo";
import { full_gym_session, full_todo_session, FeedItem } from "@/types/models";
import getFullLocalReminder from "@/database/reminders/get-full-local-reminder";

const getId = (fi: FeedItem | null) => fi?.item.id ?? null;

export default function useFullSessions(
  expandedItem: FeedItem | null,
  editingItem: FeedItem | null
) {
  const expandedId = getId(expandedItem);
  const editingId = getId(editingItem);

  const gymId =
    expandedItem?.table === "gym_sessions"
      ? expandedId
      : editingItem?.table === "gym_sessions"
        ? editingId
        : null;

  const localReminderId =
    expandedItem?.table === "local_reminders"
      ? expandedId
      : editingItem?.table === "local_reminders"
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
    queryFn: () => getFullGymSession(gymId!),
    enabled: !!gymId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const {
    data: LocalReminderFull,
    error: LocalReminderError,
    isLoading: isLoadingLocalReminder,
  } = useQuery<full_reminder>({
    queryKey: ["fullLocalReminder", localReminderId],
    queryFn: () => getFullLocalReminder(localReminderId!),
    enabled: !!localReminderId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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

  return {
    GymSessionFull,
    GymSessionError,
    isLoadingGymSession,
    LocalReminderFull,
    LocalReminderError,
    isLoadingLocalReminder,
    todoSessionFull,
    todoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
  };
}
