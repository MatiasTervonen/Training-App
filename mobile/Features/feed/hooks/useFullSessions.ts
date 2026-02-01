import { FeedItemUI } from "@/types/session";
import { useQuery } from "@tanstack/react-query";
import { getFullGymSession } from "@/database/gym/get-full-gym-session";
import { getFullTodoSession } from "@/database/todo/get-full-todo";
import { FullActivitySession } from "@/types/models";
import { getFullActivitySession } from "@/database/activities/get-full-activity-session";
import {
  getFullNotesSession,
  FullNotesSession,
} from "@/database/notes/get-full-notes";

const getId = (fi: FeedItemUI | null) => fi?.source_id ?? null;

export default function useFullSessions(
  expandedItem: FeedItemUI | null,
  editingItem: FeedItemUI | null,
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

  const activityItem =
    expandedItem?.type === "activity_sessions"
      ? expandedItem
      : editingItem?.type === "activity_sessions"
        ? editingItem
        : null;

  const activityId = activityItem ? getId(activityItem) : null;

  // Only fetch notes if there are voice recordings
  const notesItem =
    expandedItem?.type === "notes"
      ? expandedItem
      : editingItem?.type === "notes"
        ? editingItem
        : null;

  const voiceCount =
    (notesItem?.extra_fields as { "voice-count"?: number } | undefined)?.[
      "voice-count"
    ] ?? 0;

  const notesHasVoice = notesItem && voiceCount > 0;

  const notesId = notesHasVoice ? getId(notesItem) : null;

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
    refetch: refetchFullGym,
  } = useQuery({
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

  const {
    data: notesSessionFull,
    error: notesSessionError,
    isLoading: isLoadingNotesSession,
    refetch: refetchFullNotes,
  } = useQuery<FullNotesSession>({
    queryKey: ["fullNotesSession", notesId],
    queryFn: async () => await getFullNotesSession(notesId!),
    enabled: !!notesId,
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
    refetchFullGym,
    refetchFullActivity,
    activitySessionFull,
    activitySessionError,
    isLoadingActivitySession,
    notesSessionFull,
    notesSessionError,
    isLoadingNotesSession,
    refetchFullNotes,
  };
}
