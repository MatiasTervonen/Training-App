import { Session } from "@supabase/supabase-js";

export const isUserNameTaken = async (
  name: string,
  session: Session | null
): Promise<boolean | null> => {
  try {
    const response = await fetch(
      "https://training-app-bay.vercel.app/api/settings/userName-available?name=" +
        encodeURIComponent(name),
      {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      }
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
