import PinnedCarousel from "./pinnedCarousel";
import { FeedItemUI } from "@/app/(app)/types/session";
import { useRouter } from "next/navigation";
import useTogglePin from "@/app/(app)/dashboard/hooks/useTogglePin";
import useDeleteSession from "@/app/(app)/dashboard/hooks/useDeleteSession";

export default function FeedHeader({
  pinnedFeed,
  setExpandedItem,
  setEditingItem,
  pinned_context,
  queryKey = ["feed"],
}: {
  pinnedFeed: FeedItemUI[];
  setExpandedItem: (item: FeedItemUI) => void;
  setEditingItem: (item: FeedItemUI) => void;
  pinned_context: string;
  queryKey?: string[];
}) {
  const router = useRouter();
  const { togglePin } = useTogglePin(queryKey);
  const { handleDelete } = useDeleteSession();

  return (
    <>
      {pinnedFeed.length > 0 && (
        <PinnedCarousel
          pinnedFeed={pinnedFeed}
          onExpand={setExpandedItem}
          onEdit={(feedItem) => {
            if (feedItem.type === "gym_sessions") {
              router.push(`/gym/gym/${feedItem.source_id}`);
            } else {
              setEditingItem(feedItem);
            }
          }}
          onTogglePin={(item) =>
            togglePin(item.id, item.type, item.feed_context, pinned_context)
          }
          onDelete={(item) => handleDelete(item.source_id, item.type)}
        />
      )}
    </>
  );
}
