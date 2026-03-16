import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export type SharingDefault = {
  id: string;
  user_id: string;
  session_type: string;
  share_with_friends: boolean;
  created_at: string;
  updated_at: string | null;
};

export async function getSharingDefaults(): Promise<SharingDefault[]> {
  const { data, error } = await supabase
    .from("sharing_defaults")
    .select("*");

  if (error) {
    handleError(error, {
      message: "Error fetching sharing defaults",
      route: "/database/sharing/get-sharing-defaults",
      method: "GET",
    });
    throw new Error("Error fetching sharing defaults");
  }

  return (data ?? []) as SharingDefault[];
}
