import { FeedItemUI } from "@/types/session";
import { useQuery } from "@tanstack/react-query";
import { getFullGymSession, getGymSessionMedia, GymSessionMedia } from "@/database/gym/get-full-gym-session";
import { getFullTodoSession } from "@/database/todo/get-full-todo";
import { FullActivitySession, full_todo_session } from "@/types/models";
import { getFullActivitySession } from "@/database/activities/get-full-activity-session";
import {
  getFullNotesSession,
  FullNotesSession,
} from "@/database/notes/get-full-notes";
import {
  getActivityVoiceRecordings,
  ActivityVoiceRecording,
} from "@/database/activities/get-activity-voice-recordings";
import {
  getActivitySessionMedia,
  ActivitySessionMedia,
} from "@/database/activities/get-activity-session-media";
import {
  getFullWeightSession,
  FullWeightSession,
} from "@/database/weight/get-full-weight";
import {
  getFullTodoMedia,
  TodoTaskMedia,
} from "@/database/todo/get-todo-media";

const getId = (fi: FeedItemUI | null) => fi?.source_id ?? null;

export default function useFullSessions(
  expandedItem: FeedItemUI | null,
  editingItem: FeedItemUI | null,
) {
  const expandedId = getId(expandedItem);
  const editingId = getId(editingItem);

  const gymItem =
    expandedItem?.type === "gym_sessions"
      ? expandedItem
      : editingItem?.type === "gym_sessions"
        ? editingItem
        : null;

  const gymId = gymItem ? getId(gymItem) : null;

  const gymExtra = gymItem?.extra_fields as
    | { "image-count"?: number; "video-count"?: number; "voice-count"?: number }
    | undefined;
  const gymImageCount = gymExtra?.["image-count"] ?? 0;
  const gymVideoCount = gymExtra?.["video-count"] ?? 0;
  const gymVoiceCount = gymExtra?.["voice-count"] ?? 0;

  const gymHasMedia = gymItem && (gymImageCount > 0 || gymVideoCount > 0 || gymVoiceCount > 0);
  const gymMediaId = gymHasMedia ? getId(gymItem) : null;

  const todoItem =
    expandedItem?.type === "todo_lists"
      ? expandedItem
      : editingItem?.type === "todo_lists"
        ? editingItem
        : null;

  const todoId = todoItem ? getId(todoItem) : null;

  // Always fetch todo media when expanding/editing a todo
  const todoMediaId = todoId;

  const activityItem =
    expandedItem?.type === "activity_sessions"
      ? expandedItem
      : editingItem?.type === "activity_sessions"
        ? editingItem
        : null;

  const activityId = activityItem ? getId(activityItem) : null;

  // Only fetch activity voice recordings if there are any
  const activityVoiceCount =
    (activityItem?.extra_fields as { voice_count?: number } | undefined)?.[
      "voice_count"
    ] ?? 0;

  const activityHasVoice = activityItem && activityVoiceCount > 0;
  const activityVoiceId = activityHasVoice ? getId(activityItem) : null;

  // Only fetch activity media (images/videos) if there are any
  const activityExtra = activityItem?.extra_fields as
    | { voice_count?: number; "image-count"?: number; "video-count"?: number }
    | undefined;
  const activityImageCount = activityExtra?.["image-count"] ?? 0;
  const activityVideoCount = activityExtra?.["video-count"] ?? 0;

  const activityHasMedia = activityItem && (activityImageCount > 0 || activityVideoCount > 0);
  const activityMediaId = activityHasMedia ? getId(activityItem) : null;

  // Only fetch notes if there are voice recordings
  const notesItem =
    expandedItem?.type === "notes"
      ? expandedItem
      : editingItem?.type === "notes"
        ? editingItem
        : null;

  const notesExtra = notesItem?.extra_fields as
    | { "voice-count"?: number; "image-count"?: number; "video-count"?: number }
    | undefined;
  const voiceCount = notesExtra?.["voice-count"] ?? 0;
  const imageCount = notesExtra?.["image-count"] ?? 0;
  const videoCount = notesExtra?.["video-count"] ?? 0;

  const notesHasMedia = notesItem && (voiceCount > 0 || imageCount > 0 || videoCount > 0);

  const notesId = notesHasMedia ? getId(notesItem) : null;

  // Only fetch weight media if there are media attachments
  const weightItem =
    expandedItem?.type === "weight"
      ? expandedItem
      : editingItem?.type === "weight"
        ? editingItem
        : null;

  const weightExtra = weightItem?.extra_fields as
    | { "image-count"?: number; "video-count"?: number; "voice-count"?: number }
    | undefined;
  const weightImageCount = weightExtra?.["image-count"] ?? 0;
  const weightVideoCount = weightExtra?.["video-count"] ?? 0;
  const weightVoiceCount = weightExtra?.["voice-count"] ?? 0;

  const weightHasMedia =
    weightItem &&
    (weightImageCount > 0 || weightVideoCount > 0 || weightVoiceCount > 0);

  const weightId = weightHasMedia ? getId(weightItem) : null;

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
    refetch: refetchFullGym,
  } = useQuery({
    queryKey: ["fullGymSession", gymId],
    queryFn: () => getFullGymSession(gymId!),
    enabled: !!gymId,
  });

  const {
    data: gymMediaFull,
    error: gymMediaError,
    isLoading: isLoadingGymMedia,
  } = useQuery<GymSessionMedia>({
    queryKey: ["gymSessionMedia", gymMediaId],
    queryFn: async () => await getGymSessionMedia(gymMediaId!),
    enabled: !!gymMediaId,
  });

  const {
    data: todoSessionFull,
    error: todoSessionError,
    isLoading: isLoadingTodoSession,
    refetch: refetchFullTodo,
  } = useQuery<full_todo_session & { feed_context: "pinned" | "feed" }>({
    queryKey: ["fullTodoSession", todoId],
    queryFn: async () => {
      const data = await getFullTodoSession(todoId!);
      return { ...data, feed_context: todoItem!.feed_context };
    },
    enabled: !!todoId,
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
  });

  const {
    data: activityVoiceRecordings,
    error: activityVoiceError,
    isLoading: isLoadingActivityVoice,
  } = useQuery<ActivityVoiceRecording[]>({
    queryKey: ["activityVoiceRecordings", activityVoiceId],
    queryFn: async () => await getActivityVoiceRecordings(activityVoiceId!),
    enabled: !!activityVoiceId,
  });

  const {
    data: activityMedia,
    error: activityMediaError,
    isLoading: isLoadingActivityMedia,
  } = useQuery<ActivitySessionMedia>({
    queryKey: ["activitySessionMedia", activityMediaId],
    queryFn: async () => await getActivitySessionMedia(activityMediaId!),
    enabled: !!activityMediaId,
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
  });

  const {
    data: weightSessionFull,
    error: weightSessionError,
    isLoading: isLoadingWeightSession,
  } = useQuery<FullWeightSession>({
    queryKey: ["fullWeightSession", weightId],
    queryFn: async () => await getFullWeightSession(weightId!),
    enabled: !!weightId,
  });

  const {
    data: todoMediaFull,
    error: todoMediaError,
    isLoading: isLoadingTodoMedia,
    refetch: refetchFullTodoMedia,
  } = useQuery<TodoTaskMedia>({
    queryKey: ["fullTodoMedia", todoMediaId],
    queryFn: async () => await getFullTodoMedia(todoMediaId!),
    enabled: !!todoMediaId,
  });

  return {
    GymSessionFull,
    GymSessionError,
    isLoadingGymSession,
    gymMediaFull,
    gymMediaError,
    isLoadingGymMedia,
    todoSessionFull,
    todoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
    refetchFullGym,
    refetchFullActivity,
    activitySessionFull,
    activitySessionError,
    isLoadingActivitySession,
    activityVoiceRecordings,
    activityVoiceError,
    isLoadingActivityVoice,
    activityMedia,
    activityMediaError,
    isLoadingActivityMedia,
    notesSessionFull,
    notesSessionError,
    isLoadingNotesSession,
    refetchFullNotes,
    weightSessionFull,
    weightSessionError,
    isLoadingWeightSession,
    todoMediaFull,
    todoMediaError,
    isLoadingTodoMedia,
    refetchFullTodoMedia,
  };
}
