import { mutate } from "swr";
import { toast } from "react-hot-toast";
import { users } from "@/app/(app)/types/models";
import { handleError } from "@/app/(app)/utils/handleError";

export const deleteUser = async (userId: string) => {
  const confirmDelete = confirm(
    `Are you sure you want to delete user: ${userId}?`
  );
  if (!confirmDelete) return;

  mutate(
    "/api/users/get-users",
    (currentData: users[] = []) => {
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
    handleError(error);

    toast.error("Failed to delete user. Please try again.");
    // Revert the optimistic update
    mutate("/api/users/get-users");
  }
};
