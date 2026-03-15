import { Session } from "@supabase/supabase-js";
import { API_URL } from "@/utils/apiUrl";

export const isUserNameTaken = async (
  name: string,
  session: Session | null,
): Promise<boolean | null> => {
  try {
    const response = await fetch(
      `${API_URL}/api/settings/userName-available?name=${encodeURIComponent(name)}`,
      {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to check username availability");
    }

    const data = await response.json();
    return data.isTaken;
  } catch (error) {
    console.error("Error checking username availability:", error);
    return null;
  }
};
