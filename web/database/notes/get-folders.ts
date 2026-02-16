import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

export type FolderWithCount = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string | null;
  note_count: number;
};

export async function getFolders(): Promise<FolderWithCount[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("note_folders")
    .select("id, name, created_at, updated_at, notes(count)")
    .order("name", { ascending: true });

  if (error) {
    handleError(error, {
      message: "Error fetching folders",
      route: "/database/notes/get-folders",
      method: "GET",
    });
    throw new Error("Error fetching folders");
  }

  return (data ?? []).map((folder) => ({
    id: folder.id,
    name: folder.name,
    created_at: folder.created_at,
    updated_at: folder.updated_at,
    note_count: (folder.notes as { count: number }[])?.[0]?.count ?? 0,
  }));
}
