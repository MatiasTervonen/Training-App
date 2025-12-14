import PinnedCarousel from "./PinnedCarousel";
import { Dimensions, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import AppText from "../AppText";
import FeedCard from "../cards/FeedCard";
import { FeedItem } from "@/types/models";
import { useRouter } from "expo-router";
import useTogglePin from "@/hooks/feed/useTogglePin";
import useDeleteSession from "@/hooks/feed/useDeleteSession";

export default function FeedHeader({
  pinnedFeed,
  comingSoonFeed,
  setExpandedItem,
  setEditingItem,
}: {
  pinnedFeed: FeedItem[];
  comingSoonFeed: FeedItem[];
  setExpandedItem: (item: FeedItem) => void;
  setEditingItem: (item: FeedItem) => void;
}) {
  const width = Dimensions.get("window").width;
  const router = useRouter();
  const { togglePin } = useTogglePin();
  const { handleDelete } = useDeleteSession();

  return (
    <>
      {pinnedFeed.length > 0 && (
        <PinnedCarousel
          pinnedFeed={pinnedFeed}
          width={width}
          height={comingSoonFeed.length === 0 ? 194.2 : 169.4}
          onExpand={setExpandedItem}
          onEdit={(feedItem) => {
            if (feedItem.table === "gym_sessions") {
              router.push(`/training/gym/${feedItem.item.id}` as any);
            } else {
              setEditingItem(feedItem);
            }
          }}
          onTogglePin={(item) =>
            togglePin(item.item.id, item.table, item.pinned)
          }
          onDelete={(item) =>
            handleDelete(
              item.item.notification_id ?? null,
              item.item.id,
              item.table,
            )
          }
        />
      )}
      {comingSoonFeed.length > 0 && (
        <View className="px-4 bg-slate-900 border-2 border-blue-700 rounded-md overflow-hidden mb-5">
          <View className="flex-row items-center gap-2 mb-2 mt-1">
            <Sparkles size={20} color="#eab308" />
            <AppText className=" text-yellow-500">Coming Soon</AppText>
          </View>
          {comingSoonFeed.map((feedItem) => (
            <View key={feedItem.item.id} className="mb-5">
              <FeedCard
                {...feedItem}
                pinned={false}
                onExpand={() => {
                  setExpandedItem(feedItem);
                }}
                onTogglePin={() =>
                  togglePin(feedItem.item.id, feedItem.table, false)
                }
                onDelete={() => {
                  const notificationId =
                    feedItem.table === "custom_reminders"
                      ? ((feedItem.item.notification_id as
                          | string
                          | string[]
                          | null) ?? null)
                      : null;

                  handleDelete(
                    notificationId,
                    feedItem.item.id,
                    feedItem.table,
                  );
                }}
                onEdit={() => setEditingItem(feedItem)}
              />
            </View>
          ))}
        </View>
      )}
    </>
  );
}
