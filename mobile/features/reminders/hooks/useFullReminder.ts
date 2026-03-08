import { FeedItemUI } from "@/types/session";
import { full_reminder } from "@/types/session";
import { useQuery } from "@tanstack/react-query";
import { getFullLocalReminder } from "@/database/reminders/get-full-local-reminder";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";
import { ReminderByTab } from "@/database/reminders/get-reminders-by-tab";

async function getFullGlobalReminder(id: string) {
  const { data, error } = await supabase
    .from("global_reminders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    handleError(error, {
      message: "Error fetching full global reminder",
      route: "/database/reminders/get-full-global-reminder",
      method: "GET",
    });
    throw new Error("Error fetching full global reminder");
  }

  return data;
}

export default function useFullReminder(
  expandedItem: FeedItemUI | null,
  editingItem: FeedItemUI | null,
) {
  const targetItem = expandedItem ?? editingItem;
  const sourceId = targetItem?.source_id ?? null;
  const isGlobal = targetItem?.type === "global_reminders";
  const isLocal = targetItem?.type === "local_reminders";

  const {
    data: globalData,
    error: globalError,
    isLoading: isLoadingGlobal,
  } = useQuery({
    queryKey: ["fullGlobalReminder", sourceId],
    queryFn: () => getFullGlobalReminder(sourceId!),
    enabled: !!sourceId && isGlobal,
  });

  const {
    data: localData,
    error: localError,
    isLoading: isLoadingLocal,
  } = useQuery({
    queryKey: ["fullLocalReminder", sourceId],
    queryFn: () => getFullLocalReminder(sourceId!),
    enabled: !!sourceId && isLocal,
  });

  // Map global reminder to full_reminder type
  const globalReminder: full_reminder | null = globalData
    ? {
        id: globalData.id,
        title: globalData.title,
        notes: globalData.notes,
        type: globalData.type,
        notify_at: globalData.notify_at,
        created_at: globalData.created_at,
        updated_at: globalData.updated_at,
        delivered: globalData.delivered,
        seen_at: globalData.seen_at,
        mode: globalData.mode,
      }
    : null;

  // Map global reminder to ReminderByTab type for EditMyGlobalReminder
  const globalReminderByTab: ReminderByTab | null = globalData
    ? {
        id: globalData.id,
        title: globalData.title,
        notes: globalData.notes,
        type: globalData.type,
        notify_at: globalData.notify_at,
        notify_date: null,
        notify_at_time: null,
        weekdays: null,
        delivered: globalData.delivered,
        seen_at: globalData.seen_at,
        mode: globalData.mode,
        created_at: globalData.created_at,
        updated_at: globalData.updated_at,
      }
    : null;

  // Map local reminder to full_reminder type
  const localReminder: full_reminder | null = localData
    ? {
        id: localData.id,
        title: localData.title,
        notes: localData.notes,
        type: localData.type,
        notify_at: null,
        notify_date: localData.notify_date,
        notify_at_time: localData.notify_at_time,
        weekdays: localData.weekdays as number[] | null,
        created_at: localData.created_at,
        updated_at: localData.updated_at,
        delivered: localData.delivered,
        seen_at: localData.seen_at,
        mode: localData.mode,
      }
    : null;

  const reminderFull = isGlobal ? globalReminder : localReminder;
  const isLoading = isGlobal ? isLoadingGlobal : isLoadingLocal;
  const error = isGlobal ? globalError : localError;

  return {
    reminderFull,
    globalReminderByTab,
    localReminder,
    isLoading,
    error,
  };
}
