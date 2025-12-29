import { Image } from "expo-image";
import { Trash2 } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { Friends } from "@/types/models";
import { confirmAction } from "@/lib/confirmAction";
import { handleError } from "@/utils/handleError";
import { deleteFriend } from "@/database/friend/delete-friend";
import { View } from "react-native";
import AppText from "@/components/AppText";

type FriendCardProps = {
  friend: Friends;
};

export default function FriendCard({ friend }: FriendCardProps) {
  const handleDeleteFriend = async () => {
    await confirmAction({
      title: "Are you sure you want to delete this friend?",
      message: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          const response = await deleteFriend(friend.id);

          if (response.error) {
            throw new Error(response.message || "Failed to delete friend");
          }

          Toast.show({
            type: "success",
            text1: "Friend deleted successfully!",
          });
        } catch (error) {
          handleError(error, {
            message: "Error deleting friend",
            route: "/api/friend/delete-friend",
            method: "DELETE",
          });
        }
      },
    });
  };

  return (
    <View className="bg-slate-900 p-4 rounded-md shadow-md flex-row items-center justify-between mb-4">
      <View className="flex-row items-center">
        <Image
          source={{ uri: friend.user.profile_picture || "/default-avatar.png" }}
          alt="Profile Picture"
          className="rounded-full border-2 border-blue-500 w-[40px] h-[40px]"
        />
        <AppText className="ml-2 text-white">
          {friend.user.display_name}
        </AppText>
      </View>
      <Trash2 onPress={handleDeleteFriend} color="#ef4444" />
    </View>
  );
}
