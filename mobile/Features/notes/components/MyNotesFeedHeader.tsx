import PinnedCarousel from "@/Features/feed/PinnedCarousel";
import { Dimensions } from "react-native";
import { notes } from "@/types/models";
import useTogglePinNotes from "@/Features/notes/hooks/useTogglePinNotes";
import useDeleteNotes from "@/Features/notes/hooks/useDeleteNotes";
import NotesFeedCard from "@/Features/notes/cards/FeedCardNotes";

export default function MyNotesFeedHeader({
  pinnedNotes,
  setExpandedItem,
  setEditingItem,
}: {
  pinnedNotes: notes[];
  setExpandedItem: (item: notes) => void;
  setEditingItem: (item: notes) => void;
}) {
  const width = Dimensions.get("window").width;
  const { togglePin } = useTogglePinNotes();
  const { handleDelete } = useDeleteNotes();

  return (
    <>
      {pinnedNotes.length > 0 && (
        <PinnedCarousel
          pinnedFeed={pinnedNotes}
          width={width}
          height={194.2}
          CardComponent={NotesFeedCard}
          onExpand={setExpandedItem}
          onEdit={setEditingItem}
          onTogglePin={(item) => togglePin(item.id, item.pinned)}
          onDelete={(item) => handleDelete(item.id)}
        />
      )}
    </>
  );
}
