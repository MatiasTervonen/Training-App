import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

type Props = {
  id: string;
  title: string;
  notes: string;
  updated_at: string;
  folderId?: string | null;
  newImages?: { storage_path: string }[];
  deletedImageIds?: string[];
};

export async function editNotes({
  id,
  title,
  notes,
  updated_at,
  folderId,
  newImages,
  deletedImageIds,
}: Props) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("notes_edit_note", {
    p_id: id,
    p_title: title,
    p_notes: notes,
    p_updated_at: updated_at,
    p_folder_id: folderId ?? undefined,
    p_new_images: newImages ?? [],
    p_deleted_image_ids: deletedImageIds ?? [],
  });

  if (error) {
    console.log("error editing notes", error);
    handleError(error, {
      message: "Error editing notes",
      route: "/database/notes/edit-notes",
      method: "POST",
    });
    throw new Error("Error editing notes");
  }

  return data;
}
