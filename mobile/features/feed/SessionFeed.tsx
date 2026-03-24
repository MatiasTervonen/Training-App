import { useEffect, useState, useRef } from "react";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import ErrorMessage from "@/components/ErrorMessage";
import {
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
} from "react-native";
import FeedCard from "@/features/feed-cards/FeedCard";
import { FeedSkeleton } from "@/components/skeletetons";
import { LinearGradient } from "expo-linear-gradient";
import FullScreenModal from "@/components/FullScreenModal";
import GymSession from "@/features/gym/cards/gym-expanded";
import NotesSession from "@/features/notes/cards/notes-expanded";
import WeightSession from "@/features/weight/cards/weight-expanded";
import EditNotes from "@/features/notes/cards/edit-notes";
import EditWeight from "@/features/weight/cards/weight-edit";
import HandleEditGlobalReminder from "@/features/reminders/cards/editGlobalReminder";
import { useRouter } from "expo-router";
import TodoSession from "@/features/todo/cards/todo-expanded";
import EditTodo from "@/features/todo/cards/todo-edit";
import ReminderSession from "@/features/reminders/cards/reminder-expanded-feed";
import useDeleteSession from "@/features/feed/hooks/useDeleteSession";
import useTogglePin from "@/features/feed/hooks/useTogglePin";
import useHideFeedItem from "@/features/feed/hooks/useHideFeedItem";
import useFeed from "@/features/feed/hooks/useFeed";
import useFullSessions from "@/features/feed/hooks/useFullSessions";
import FeedHeader from "@/features/feed/FeedHeader";
import FeedFooter from "@/features/feed/FeedFooter";
import HandleEditLocalReminder from "@/features/reminders/cards/editLocalReminder";
import { useAppReadyStore } from "@/lib/stores/appReadyStore";
import { FeedItemUI } from "@/types/session";
import useUpdateFeedItem from "@/features/feed/hooks/useUpdateFeedItem";
import ActivitySession from "@/features/activities/cards/activity-feed-expanded/activity";
import ActivitySessionEdit from "@/features/activities/cards/activity-edit";
import ReportSession from "@/features/reports/cards/report-expanded";
import TutorialSession from "@/features/feed-cards/tutorial-expanded";
import NutritionExpanded from "@/features/nutrition/cards/nutrition-expanded";
import useUpdateFeedItemToTop from "./hooks/useUpdateFeedItemToTop";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Users } from "lucide-react-native";
import useSocialFeed from "@/features/social-feed/hooks/useSocialFeed";
import useToggleLike from "@/features/social-feed/hooks/useToggleLike";
import SocialFeedCard from "@/features/social-feed/components/SocialFeedCard";
import FeedModeToggle from "@/features/social-feed/components/FeedModeToggle";
import { SocialFeedItem } from "@/types/social-feed";
import CommentSheet from "@/features/social-feed/components/CommentSheet";
import { getFriendGymSession } from "@/database/social-feed/get-friend-gym-session";
import { getFriendActivitySession } from "@/database/social-feed/get-friend-activity-session";
import BodyTextNC from "@/components/BodyTextNC";

type SessionFeedProps = {
  expandReminderId?: string;
  initialFeedMode?: "my" | "friends";
  initialCommentFeedItemId?: string;
};

export default function SessionFeed({
  expandReminderId,
  initialFeedMode,
  initialCommentFeedItemId,
}: SessionFeedProps) {
  const setFeedReady = useAppReadyStore((state) => state.setFeedReady);
  const feedReady = useAppReadyStore((state) => state.feedReady);
  const queryClient = useQueryClient();
  const { t } = useTranslation("feed");

  const [feedMode, setFeedMode] = useState<"my" | "friends">(
    initialFeedMode ?? "my",
  );
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSocialItem, setExpandedSocialItem] =
    useState<SocialFeedItem | null>(null);
  const [commentFeedItemId, setCommentFeedItemId] = useState<string | null>(
    initialCommentFeedItemId ?? null,
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedExpandedChanges, setHasUnsavedExpandedChanges] =
    useState(false);
  const expandedReminderRef = useRef<string | null>(null);

  // Sync feed mode when navigating from notification while already on dashboard
  useEffect(() => {
    if (initialFeedMode) {
      setFeedMode(initialFeedMode);
    }
  }, [initialFeedMode]);

  // Auto-open comment sheet when navigating from comment/reply notification
  useEffect(() => {
    if (initialCommentFeedItemId) {
      setCommentFeedItemId(initialCommentFeedItemId);
    }
  }, [initialCommentFeedItemId]);

  const router = useRouter();

  // useFeed hook to get feed data
  // includes infinite scrolling, prefetching, sorting, and other feed related logic
  const {
    data,
    error,
    isLoading,
    mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSuccess,
    pinnedFeed,
    unpinnedFeed,
  } = useFeed();

  useEffect(() => {
    if (!isLoading && isSuccess) {
      setFeedReady();
    }
  }, [isLoading, isSuccess, setFeedReady]);

  // Auto-expand reminder when navigating from alarm
  useEffect(() => {
    if (
      expandReminderId &&
      isSuccess &&
      !isLoading &&
      expandedReminderRef.current !== expandReminderId
    ) {
      // Search in both pinned and unpinned feeds
      const allItems = [...pinnedFeed, ...unpinnedFeed];
      const reminderItem = allItems.find(
        (item) =>
          item.source_id === expandReminderId &&
          (item.type === "local_reminders" || item.type === "global_reminders"),
      );

      if (reminderItem) {
        expandedReminderRef.current = expandReminderId;
        setExpandedItem(reminderItem);
        router.setParams({ reminderId: undefined });
      }
    }
  }, [expandReminderId, isSuccess, isLoading, pinnedFeed, unpinnedFeed, router]);

  // handle feedItem pin toggling

  const { togglePin } = useTogglePin();

  // handle feedItem deletion

  const { handleDelete } = useDeleteSession();

  // handle feedItem hiding

  const { handleHide } = useHideFeedItem();

  // useFullSessions hook to get full sessions

  const {
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
    weightSessionFull,
    weightSessionError,
    isLoadingWeightSession,
    todoMediaFull,
    refetchFullTodoMedia,
  } = useFullSessions(expandedItem, editingItem);

  // Social feed hooks
  const socialFeed = useSocialFeed();
  const { mutate: toggleLikeMutation } = useToggleLike();

  // Fetch full friend session when expanded
  const { data: friendGymData, isLoading: isLoadingFriendGym } = useQuery({
    queryKey: ["friendGymSession", expandedSocialItem?.id],
    queryFn: () => getFriendGymSession(expandedSocialItem!.id),
    enabled: !!expandedSocialItem && expandedSocialItem.type === "gym_sessions",
  });

  const { data: friendActivityData, isLoading: isLoadingFriendActivity } =
    useQuery({
      queryKey: ["friendActivitySession", expandedSocialItem?.id],
      queryFn: () => getFriendActivitySession(expandedSocialItem!.id),
      enabled:
        !!expandedSocialItem && expandedSocialItem.type === "activity_sessions",
    });

  // useUpdateFeedItem hook to update feed item in cache
  const { updateFeedItem } = useUpdateFeedItem();

  // useUpdateFeedItem hook to update feed item in cache and move it to top
  const { updateFeedItemToTop } = useUpdateFeedItemToTop();

  if (!feedReady) {
    return null;
  }

  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {feedMode === "my" ? (
        <>
          {isLoading || !data ? (
            <FeedSkeleton count={5} />
          ) : error ? (
            <ErrorMessage message={t("feed.loadError")} fullPage />
          ) : !data ||
            (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
            <View className="flex-1 items-center mt-[30%] px-8">
              <View className="items-center">
                <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
                  <LayoutDashboard size={36} color="#94a3b8" />
                </View>
                <AppText className="text-xl text-center mb-3">
                  {t("feed.noSessions")}
                </AppText>
                <BodyTextNC className="text-sm text-gray-400 text-center">
                  {t("feed.noSessionsDesc")}
                </BodyTextNC>
              </View>
            </View>
          ) : (
            <FlatList
              data={unpinnedFeed}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingBottom: 100,
                paddingTop: pinnedFeed.length === 0 ? 20 : 0,
              }}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={async () => {
                    setRefreshing(true);
                    await mutateFeed();
                    setRefreshing(false);
                  }}
                />
              }
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.5}
              renderItem={({ item: feedItem }) => (
                <View className={`px-4 ${unpinnedFeed ? "pb-5" : ""}`}>
                  <FeedCard
                    item={feedItem as FeedItemUI}
                    pinned={false}
                    onExpand={() => {
                      if (feedItem.type === "habits") {
                        router.push("/habits");
                        return;
                      }
                      setExpandedItem(feedItem);
                    }}
                    onTogglePin={() =>
                      togglePin(
                        feedItem.id,
                        feedItem.type,
                        feedItem.feed_context,
                        "main",
                      )
                    }
                    onDelete={() => {
                      handleDelete(feedItem.source_id, feedItem.type);
                    }}
                    onHide={() => handleHide(feedItem.id)}
                    onEdit={() => {
                      if (feedItem.type === "habits") {
                        router.push("/habits");
                        return;
                      }
                      if (feedItem.type === "gym_sessions") {
                        router.push(`/gym/gym/${feedItem.source_id}`);
                      } else {
                        setEditingItem({ ...feedItem, id: feedItem.source_id });
                      }
                    }}
                  />
                </View>
              )}
              ListHeaderComponent={
                <FeedHeader
                  pinnedFeed={pinnedFeed}
                  setExpandedItem={setExpandedItem}
                  setEditingItem={setEditingItem}
                  pinned_context="main"
                />
              }
              ListFooterComponent={
                <FeedFooter
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={hasNextPage}
                  data={data}
                />
              }
            />
          )}
        </>
      ) : (
        <>
          {socialFeed.isLoading ? (
            <FeedSkeleton count={5} />
          ) : socialFeed.error ? (
            <ErrorMessage message={t("feed.loadError")} fullPage />
          ) : socialFeed.items.length === 0 ? (
            <View className="flex-1 items-center mt-[30%] px-8">
              <View className="items-center">
                <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
                  <Users size={36} color="#94a3b8" />
                </View>
                <AppText className="text-xl text-center mb-3">
                  {t("social:social.noFriendPosts")}
                </AppText>
                <BodyTextNC className="text-sm text-gray-400 text-center">
                  {t("social:social.noFriendsYet")}
                </BodyTextNC>
              </View>
            </View>
          ) : (
            <FlatList
              data={socialFeed.items}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={async () => {
                    setRefreshing(true);
                    await socialFeed.refetch();
                    setRefreshing(false);
                  }}
                />
              }
              onEndReached={() => {
                if (socialFeed.hasNextPage && !socialFeed.isFetchingNextPage) {
                  socialFeed.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.5}
              renderItem={({ item: socialItem }) => (
                <SocialFeedCard
                  item={socialItem}
                  onToggleLike={() => toggleLikeMutation(socialItem.id)}
                  onExpand={() => setExpandedSocialItem(socialItem)}
                  onOpenComments={() => setCommentFeedItemId(socialItem.id)}
                />
              )}
            />
          )}
        </>
      )}

      <FeedModeToggle feedMode={feedMode} setFeedMode={setFeedMode} />

      {expandedItem && (
        <FullScreenModal
          isOpen={!!expandedItem}
          onClose={() => {
            setHasUnsavedExpandedChanges(false);
            setExpandedItem(null);
            // Reset ref so same reminder can be expanded again from alarm
            expandedReminderRef.current = null;
          }}
          confirmBeforeClose={hasUnsavedExpandedChanges}
          scrollable={false}
        >
          {expandedItem.type === "notes" && (
            <NotesSession
              note={expandedItem}
              voiceRecordings={notesSessionFull}
              isLoadingVoice={isLoadingNotesSession}
              error={notesSessionError}
            />
          )}
          {expandedItem.type === "weight" && (
            <WeightSession
              {...expandedItem}
              weightMedia={weightSessionFull}
              isLoadingMedia={isLoadingWeightSession}
              mediaError={weightSessionError}
            />
          )}
          {expandedItem.type === "global_reminders" && (
            <ReminderSession {...expandedItem} />
          )}

          {expandedItem.type === "local_reminders" && (
            <ReminderSession {...expandedItem} />
          )}

          {expandedItem.type === "todo_lists" && (
            <>
              {isLoadingTodoSession ? (
                <View className="gap-2 justify-center items-center pt-40">
                  <BodyText className="text-lg">{t("feed.loadingTodo")}</BodyText>
                  <ActivityIndicator />
                </View>
              ) : todoSessionError ? (
                <View>
                  <BodyText className="gap-2 justify-center mt-20 text-lg">
                    {t("feed.todoError")}
                  </BodyText>
                </View>
              ) : (
                todoSessionFull && (
                  <TodoSession
                    initialTodo={todoSessionFull}
                    onSave={(updatedItem) => {
                      updateFeedItemToTop(updatedItem);
                      refetchFullTodo();
                    }}
                    onDirtyChange={setHasUnsavedExpandedChanges}
                    taskMedia={todoMediaFull}
                  />
                )
              )}
            </>
          )}

          {expandedItem.type === "gym_sessions" && (
            <>
              {isLoadingGymSession ? (
                <View className="gap-5 items-center justify-center mt-40 px-10">
                  <BodyText className="text-lg">{t("feed.loadingGym")}</BodyText>
                  <ActivityIndicator />
                </View>
              ) : GymSessionError ? (
                <BodyText className="text-center text-xl mt-40 px-10">
                  {t("feed.gymError")}
                </BodyText>
              ) : (
                GymSessionFull && (
                  <GymSession
                    {...GymSessionFull}
                    gymMedia={gymMediaFull}
                    isLoadingMedia={isLoadingGymMedia}
                    mediaError={gymMediaError}
                    mediaHints={expandedItem.extra_fields as { "image-count"?: number; "video-count"?: number; "voice-count"?: number }}
                  />
                )
              )}
            </>
          )}

          {expandedItem.type === "reports" && (
            <ReportSession item={expandedItem} />
          )}

          {expandedItem.type === "tutorial" && <TutorialSession />}

          {expandedItem.type === "nutrition" && (
            <NutritionExpanded item={expandedItem} />
          )}

          {expandedItem.type === "activity_sessions" && (
            <>
              {isLoadingActivitySession ? (
                <View className="gap-5 items-center justify-center mt-40 px-10">
                  <BodyText className="text-lg">
                    {t("feed.loadingActivity")}
                  </BodyText>
                  <ActivityIndicator />
                </View>
              ) : activitySessionError ? (
                <BodyText className="text-center text-xl mt-40 px-10">
                  {t("feed.activityError")}
                </BodyText>
              ) : (
                activitySessionFull && (
                  <ActivitySession
                    {...activitySessionFull}
                    voiceRecordings={activityVoiceRecordings}
                    isLoadingVoice={isLoadingActivityVoice}
                    voiceError={activityVoiceError}
                    media={activityMedia}
                    isLoadingMedia={isLoadingActivityMedia}
                    mediaError={activityMediaError}
                  />
                )
              )}
            </>
          )}
        </FullScreenModal>
      )}

      {editingItem && (
        <FullScreenModal
          isOpen={!!editingItem}
          onClose={() => {
            setHasUnsavedChanges(false);
            setEditingItem(null);
          }}
          confirmBeforeClose={hasUnsavedChanges}
          scrollable={false}
        >
          {editingItem.type === "notes" && (
            <EditNotes
              note={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={(updatedItem) => {
                updateFeedItemToTop(updatedItem);
                queryClient.invalidateQueries({
                  queryKey: ["fullNotesSession", editingItem.source_id],
                });
              }}
              voiceRecordings={notesSessionFull}
              isLoadingVoice={isLoadingNotesSession}
              onDirtyChange={setHasUnsavedChanges}
            />
          )}

          {editingItem.type === "global_reminders" && (
            <HandleEditGlobalReminder
              reminder={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={(updatedItem) => {
                updateFeedItemToTop(updatedItem);
              }}
              onDirtyChange={setHasUnsavedChanges}
            />
          )}

          {editingItem.type === "local_reminders" && (
            <HandleEditLocalReminder
              reminder={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={(updatedItem) => {
                updateFeedItemToTop(updatedItem);
              }}
              onDirtyChange={setHasUnsavedChanges}
            />
          )}

          {editingItem.type === "todo_lists" && (
            <>
              {isLoadingTodoSession ? (
                <View className="gap-5 items-center justify-center mt-40 px-10">
                  <BodyText className="text-lg">{t("feed.loadingTodo")}</BodyText>
                  <ActivityIndicator />
                </View>
              ) : todoSessionError ? (
                <BodyText className="text-gray-200 text-center text-xl mt-40 px-10">
                  {t("feed.todoError")}
                </BodyText>
              ) : (
                todoSessionFull && (
                  <EditTodo
                    todo_session={todoSessionFull}
                    onClose={() => setEditingItem(null)}
                    onSave={async (updatedItem) => {
                      await Promise.all([
                        updateFeedItemToTop(updatedItem),
                        refetchFullTodo(),
                        refetchFullTodoMedia(),
                      ]);
                    }}
                    onDirtyChange={setHasUnsavedChanges}
                    taskMedia={todoMediaFull}
                  />
                )
              )}
            </>
          )}

          {editingItem.type === "activity_sessions" && (
            <>
              {isLoadingActivitySession ? (
                <View className="gap-5 items-center justify-center mt-40 px-10">
                  <BodyText className="text-lg">
                    {t("feed.loadingActivity")}
                  </BodyText>
                  <ActivityIndicator />
                </View>
              ) : activitySessionError ? (
                <BodyText className="text-center text-xl mt-40 px-10">
                  {t("feed.activityError")}
                </BodyText>
              ) : (
                activitySessionFull && (
                  <ActivitySessionEdit
                    activity={activitySessionFull}
                    onClose={() => setEditingItem(null)}
                    onSave={async (updatedItem) => {
                      await Promise.all([
                        updateFeedItem(updatedItem),
                        refetchFullActivity(),
                      ]);
                    }}
                    onDirtyChange={setHasUnsavedChanges}
                  />
                )
              )}
            </>
          )}

          {editingItem.type === "weight" && (
            <EditWeight
              weight={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={(updatedItem) => {
                updateFeedItem(updatedItem);
                queryClient.invalidateQueries({
                  queryKey: ["fullWeightSession", editingItem.source_id],
                });
              }}
              weightMedia={weightSessionFull}
              isLoadingMedia={isLoadingWeightSession}
              onDirtyChange={setHasUnsavedChanges}
            />
          )}
        </FullScreenModal>
      )}

      <CommentSheet
        feedItemId={commentFeedItemId}
        onClose={() => setCommentFeedItemId(null)}
      />

      {expandedSocialItem && (
        <FullScreenModal
          isOpen={!!expandedSocialItem}
          onClose={() => setExpandedSocialItem(null)}
          scrollable={false}
        >
          {expandedSocialItem.type === "gym_sessions" && (
            <>
              {isLoadingFriendGym ? (
                <View className="gap-5 items-center justify-center mt-40 px-10">
                  <BodyText className="text-lg">{t("feed.loadingGym")}</BodyText>
                  <ActivityIndicator />
                </View>
              ) : friendGymData ? (
                <GymSession {...friendGymData} readOnly />
              ) : (
                <BodyText className="text-center text-xl mt-40 px-10">
                  {t("feed.gymError")}
                </BodyText>
              )}
            </>
          )}
          {expandedSocialItem.type === "activity_sessions" && (
            <>
              {isLoadingFriendActivity ? (
                <View className="gap-5 items-center justify-center mt-40 px-10">
                  <BodyText className="text-lg">
                    {t("feed.loadingActivity")}
                  </BodyText>
                  <ActivityIndicator />
                </View>
              ) : friendActivityData ? (
                <ActivitySession
                  {...friendActivityData.session}
                  voiceRecordings={friendActivityData.voiceRecordings}
                  media={friendActivityData.media}
                  readOnly
                />
              ) : (
                <BodyText className="text-center text-xl mt-40 px-10">
                  {t("feed.activityError")}
                </BodyText>
              )}
            </>
          )}
        </FullScreenModal>
      )}
    </LinearGradient>
  );
}
