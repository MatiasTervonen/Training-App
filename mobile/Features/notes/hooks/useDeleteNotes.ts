import { confirmAction } from "@/lib/confirmAction";
import { useQueryClient } from "@tanstack/react-query";
import { deleteNotes } from "@/database/notes/delete-notes";
import Toast from "react-native-toast-message";
import { notes } from "@/types/models";

type FeedData = {
  pageParams: number[];
  pages: {
    feed: notes[];
    nextPage?: number | null;
  }[];
};

export default function useDeleteNotes() {
  const queryClient = useQueryClient();

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction({
      title: "Are you sure you want to delete this note?",
    });
    if (!confirmed) return;

    const queryKey = ["myNotes"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      const newPages = oldData.pages.map((page) => {
        const newFeed = page.feed.filter((feedItem) => feedItem.id !== id);
        return { ...page, feed: newFeed };
      });
      return { ...oldData, pages: newPages };
    });

    try {
      await deleteNotes(id);

      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Note has been deleted successfully.",
      });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete note.",
      });
    }
  };

  return { handleDelete };
}
