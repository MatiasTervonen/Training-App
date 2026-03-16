import AppText from "@/components/AppText";
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { FeedSkeleton } from "@/components/skeletetons";
import FeedFooter from "@/features/feed/FeedFooter";
import FullScreenModal from "@/components/FullScreenModal";
import { LinearGradient } from "expo-linear-gradient";
import useMyActivitiesFeed from "@/features/activities/hooks/useMyActivitiesFeed";
import FeedCard from "@/features/feed-cards/FeedCard";
import { FeedItemUI } from "@/types/session";
import FeedHeader from "@/features/feed/FeedHeader";
import useFullSessions from "@/features/feed/hooks/useFullSessions";
import ActivitySession from "@/features/activities/cards/activity-feed-expanded/activity";
import ActivitySessionEdit from "@/features/activities/cards/activity-edit";
import useTogglePin from "@/features/feed/hooks/useTogglePin";
import useDeleteSession from "@/features/feed/hooks/useDeleteSession";
import useUpdateFeedItem from "@/features/feed/hooks/useUpdateFeedItem";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react-native";
import useActivityTypes from "@/features/activities/hooks/useActivityTypes";
import ActivityTypeFilterChips from "@/features/activities/components/ActivityTypeFilterChips";

export default function MyActivitiesScreen() {
  const { t } = useTranslation("activities");
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const { activityTypes } = useActivityTypes();

  const {
    data,
    error,
    isLoading,
    mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    pinnedFeed,
    unpinnedFeed,
    queryKey,
    pinnedContext,
  } = useMyActivitiesFeed(selectedSlug ?? undefined);

  // handle feedItem pin toggling
  const { togglePin } = useTogglePin(queryKey);

  // handle feedItem deletion
  const { handleDelete } = useDeleteSession();

  // handle feed item updates
  const { updateFeedItem } = useUpdateFeedItem(queryKey);

  const {
    activitySessionFull,
    activitySessionError,
    isLoadingActivitySession,
    refetchFullActivity,
  } = useFullSessions(expandedItem, editingItem);

  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View className="absolute top-0 left-0 right-0 z-10">
        <ActivityTypeFilterChips
          activityTypes={activityTypes}
          selectedSlug={selectedSlug}
          onSelectAll={() => setSelectedSlug(null)}
          onSelectType={setSelectedSlug}
        />
      </View>
      {isLoading ? (
        <View className="pt-[50px]">
          <FeedSkeleton count={5} />
        </View>
      ) : error ? (
        <AppText className="text-center text-lg mt-20 mx-auto px-10">
          {t("activities.mySessions.loadError")}
        </AppText>
      ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
        <View className="flex-1 items-center mt-[20%] px-8">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
              <MapPin size={36} color="#94a3b8" />
            </View>
            <AppText className="text-xl text-center mb-3">
              {t("activities.mySessions.noSessions")}
            </AppText>
            <AppText className="text-sm text-gray-400 text-center leading-5">
              {t("activities.mySessions.noSessionsDesc")}
            </AppText>
          </View>
        </View>
      ) : (
        <FlatList
          data={unpinnedFeed}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: 50,
          }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              progressViewOffset={50}
              onRefresh={async () => {
                setRefreshing(true);
                await mutateFeed();
                setRefreshing(false);
              }}
            />
          }
          onEndReachedThreshold={0.5}
          renderItem={({ item: feedItem }) => (
            <View className={`px-4 ${unpinnedFeed ? "pb-5" : ""}`}>
              <FeedCard
                item={feedItem as FeedItemUI}
                pinned={false}
                onExpand={() => {
                  setExpandedItem(feedItem);
                }}
                onTogglePin={() =>
                  togglePin(
                    feedItem.id,
                    feedItem.type,
                    feedItem.feed_context,
                    pinnedContext,
                  )
                }
                onDelete={() => {
                  handleDelete(feedItem.source_id, feedItem.type);
                }}
                onEdit={() => {
                  setEditingItem({ ...feedItem, id: feedItem.source_id });
                }}
              />
            </View>
          )}
          ListFooterComponent={
            <FeedFooter
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              data={data as any}
            />
          }
          ListHeaderComponent={
            <>
              <FeedHeader
                pinnedFeed={pinnedFeed}
                setExpandedItem={setExpandedItem}
                setEditingItem={setEditingItem}
                pinned_context={pinnedContext}
                queryKey={queryKey}
              />
              {pinnedFeed.length === 0 && <View className="h-5" />}
            </>
          }
        />
      )}

      {expandedItem && (
        <FullScreenModal
          isOpen={!!expandedItem}
          onClose={() => setExpandedItem(null)}
        >
          {isLoadingActivitySession ? (
            <View className="gap-5 items-center justify-center mt-40 px-10">
              <AppText className="text-lg">
                {t("activities.mySessions.loadingDetails")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : activitySessionError ? (
            <AppText className="text-center text-xl mt-40 px-10">
              {t("activities.mySessions.loadDetailsError")}
            </AppText>
          ) : (
            activitySessionFull && <ActivitySession {...activitySessionFull} />
          )}
        </FullScreenModal>
      )}

      {editingItem && (
        <FullScreenModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
        >
          {isLoadingActivitySession ? (
            <View className="gap-5 items-center justify-center mt-40 px-10">
              <AppText className="text-lg">
                {t("activities.mySessions.loadingSession")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : activitySessionError ? (
            <AppText className="text-center text-xl mt-40 px-10">
              {t("activities.mySessions.loadDetailsError")}
            </AppText>
          ) : (
            activitySessionFull && (
              <ActivitySessionEdit
                activity={activitySessionFull}
                onClose={() => setEditingItem(null)}
                onSave={(updatedItem) => {
                  updateFeedItem(updatedItem);
                  refetchFullActivity();
                  setEditingItem(null);
                }}
              />
            )
          )}
        </FullScreenModal>
      )}
    </LinearGradient>
  );
}
