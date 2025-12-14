import { full_reminder } from "@/types/session";
import { useQuery } from "@tanstack/react-query";
import { getFullGymSession } from "@/database/gym/get-full-gym-session";
import GetFullCustomReminder from "@/database/reminders/get-full-custom-reminder";
import { getFullTodoSession } from "@/database/todo/get-full-todo";
import { full_gym_session, full_todo_session, FeedItem } from "@/types/models";

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
    queryFn: () => getFullGymSession(gymId!),
    enabled: !!gymId,
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
  } = useQuery<full_reminder>({
    queryKey: ["fullCustomReminder", customReminderId],
    queryFn: () => GetFullCustomReminder(customReminderId!),
    enabled: !!customReminderId,
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
    CustomReminderFull,
    CustomReminderError,
    isLoadingCustomReminder,
    todoSessionFull,
    todoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
  };
}
