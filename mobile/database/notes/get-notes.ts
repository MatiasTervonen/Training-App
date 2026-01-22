import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";
import { notes } from "@/types/models";


export default async function getNotes({
    pageParam = 0,
    limit = 10,
}: {
    pageParam?: number;
    limit?: number;
}): Promise<{
    feed: notes[];
    nextPage: number | null;
}> {
    const from = pageParam * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("pinned", { ascending: false })
        .order("activity_at", { ascending: false })
        .range(from, to);

    if (error) {
        handleError(error, {
            message: "Error fetching notes",
            route: "server-action: getNotes",
            method: "direct",
        });
        throw new Error(
            "Error fetching notes"
        );
    }

    const hasMore = (data?.length ?? 0) === limit;

    return { feed: data, nextPage: hasMore ? pageParam + 1 : null };
}
