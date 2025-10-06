import { toast } from "react-hot-toast";
import { mutate } from "swr";
import { handleError } from "@/app/(app)/utils/handleError";

export const promoteUser = async (userId: string, userRole: string) => {
  const confirmPromote = confirm(
    `Are you sure you want to promote user: ${userId} to ${userRole}?`
  );
  if (!confirmPromote) return;

  try {
    const response = await fetch("/api/users/promote-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userRole, user_id: userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to promote user");
    }

    await response.json();
    toast.success(`User promoted to ${userRole} successfully.`);
    mutate("/api/users/get-users"); // Revalidate the user list
  } catch (error) {
    handleError(error);

    toast.error("Failed to promote user. Please try again.");
    // Revert the optimistic update
    mutate("/api/users/get-users");
  }
};
