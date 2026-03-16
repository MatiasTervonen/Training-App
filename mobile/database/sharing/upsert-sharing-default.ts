import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function upsertSharingDefault(
  sessionType: string,
  shareWithFriends: boolean,
) {
  const { error } = await supabase
    .from("sharing_defaults")
    .upsert(
      {
        session_type: sessionType,
        share_with_friends: shareWithFriends,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,session_type" },
    );

  if (error) {
    handleError(error, {
      message: "Error upserting sharing default",
      route: "/database/sharing/upsert-sharing-default",
      method: "POST",
    });
    throw new Error("Error upserting sharing default");
  }
}
