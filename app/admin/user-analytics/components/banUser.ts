import { toast } from "react-hot-toast";

import { mutate } from "swr";
 
 export const banUser = async (userId: string, duration: string, reason: string) => {
    if (!duration) return;

    const confirmBan = confirm(`Are you sure you want to ban user: ${userId}?`);
    if (!confirmBan) return;

    try {
      const response = await fetch("/api/users/ban-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, duration, reason }),
      });

      if (!response.ok) {
        throw new Error("Failed to ban user");
      }

      await response.json();
      if (duration === "unban") {
        toast.success("User unbanned successfully.");
      } else {
        toast.success(`User banned for ${duration}.`);
      }
      mutate("/api/users/get-users"); // Revalidate the user list
    } catch (error) {
      console.error("Error banning user:", error);

      toast.error("Failed to ban user. Please try again.");
      // Revert the optimistic update
      mutate("/api/users/get-users");
    }
  };