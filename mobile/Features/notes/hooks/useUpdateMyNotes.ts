import { notes } from "@/types/models";
import { useQueryClient } from "@tanstack/react-query";

type FeedData = {
    pageParams: number[];
    pages: {
        feed: notes[];
        nextPage?: number | null;
    }[];
}


export default function useUpdateMyNotes() {
    const queryClient = useQueryClient();

    const updateMyNotes = (updateMyNotes: notes) => {
        return queryClient.setQueryData<FeedData>(["myNotes"], (oldData) => {
            if (!oldData) return oldData;

            return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                    ...page,
                    feed: page.feed.map((item) =>
                        item.id === updateMyNotes.id
                            ? { ...item, ...updateMyNotes }
                            : item
                    ),
                })),
            };
        });
    };
    return { updateMyNotes };
}