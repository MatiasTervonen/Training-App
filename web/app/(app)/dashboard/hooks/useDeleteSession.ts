"use client";

import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { deleteSession } from "@/app/(app)/database/feed";
import { FeedData } from "@/app/(app)/types/session";

export default function useDeleteSession() {
  const queryClient = useQueryClient();

  const handleDelete = async (
    id: string,
    table:
      | "notes"
      | "gym_sessions"
      | "weight"
      | "todo_lists"
      | "global_reminders"
      | "local_reminders"
  ) => {
    const confirmDetlete = confirm(
      "Are you sure you want to delete this item?"
    );
    if (!confirmDetlete) return;

    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const perviousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      const newPages = oldData.pages.map((page) => {
        const newFeed = page.feed.filter((feedItem) => feedItem.id !== id);
        return { ...page, feed: newFeed };
      });
      return { ...oldData, pages: newPages };
    });

    try {
      await deleteSession({ id, table });

      if (table === "weight") {
        queryClient.refetchQueries({
          queryKey: ["get-weight"],
          exact: true,
        });
      }

      if (table === "global_reminders") {
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        });
      }

      toast.success("Item has been deleted successfully.");
      queryClient.invalidateQueries({ queryKey });
    } catch {
      queryClient.setQueryData(queryKey, perviousFeed);
      toast.error("Failed to delete item");
    }
  };

  return { handleDelete };
}
