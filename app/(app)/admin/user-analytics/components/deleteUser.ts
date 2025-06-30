import { mutate } from "swr";
import { toast } from "react-hot-toast";

type Users = {
  id: string;
  email: string;
  role: string;
  display_name: string;
  created_at: string;
  banned_until?: string | null;
  ban_reason?: string | null;
};

export const deleteUser = async (userId: string) => {
  const confirmDelete = confirm(
    `Are you sure you want to delete user: ${userId}?`
  );
  if (!confirmDelete) return;

  mutate(
    "/api/users/get-users",
    (currentData: Users[] = []) => {
      return currentData?.filter((user) => user.id !== userId) || [];
    },
    false
  );

  try {
    const response = await fetch("/api/users/delete-user", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete user");
    }

    await response.json();
    toast.success("User deleted successfully.");
    mutate("/api/users/get-users"); // Revalidate the user list
  } catch (error) {
    console.error("Error deleting user:", error);

    toast.error("Failed to delete user. Please try again.");
    // Revert the optimistic update
    mutate("/api/users/get-users");
  }
};
