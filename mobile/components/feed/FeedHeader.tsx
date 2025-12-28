import PinnedCarousel from "./PinnedCarousel";
import { Dimensions } from "react-native";
import { FeedItemUI } from "@/types/session";
import { useRouter } from "expo-router";
import useTogglePin from "@/hooks/feed/useTogglePin";
import useDeleteSession from "@/hooks/feed/useDeleteSession";

export default function FeedHeader({
  pinnedFeed,
  setExpandedItem,
  setEditingItem,
}: {
  pinnedFeed: FeedItemUI[];
  setExpandedItem: (item: FeedItemUI) => void;
  setEditingItem: (item: FeedItemUI) => void;
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
          height={194.2}
          onExpand={setExpandedItem}
          onEdit={(feedItem) => {
            if (feedItem.type === "gym_sessions") {
              router.push(`/training/gym/${feedItem.id}` as any);
            } else {
              setEditingItem(feedItem);
            }
          }}
          onTogglePin={(item) =>
            togglePin(item.id, item.type, item.feed_context)
          }
          onDelete={(item) => handleDelete(item.source_id, item.type)}
        />
      )}
    </>
  );
}
