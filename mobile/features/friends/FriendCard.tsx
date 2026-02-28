import { Image } from "expo-image";
import { Trash2 } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { Friends } from "@/types/models";
import { useConfirmAction } from "@/lib/confirmAction";
import { handleError } from "@/utils/handleError";
import { useDeleteFriend } from "@/features/friends/hooks/useDeleteFriend";
import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";

type FriendCardProps = {
  friend: Friends;
};

export default function FriendCard({ friend }: FriendCardProps) {
  const confirmAction = useConfirmAction();
  const deleteFriend = useDeleteFriend();
  const { t } = useTranslation("friends");

  const handleDeleteFriend = async () => {
    const confirmed = await confirmAction({
      title: t("friends.deleteConfirmation"),
    });
    if (!confirmed) return;

    try {
      await deleteFriend.mutateAsync(friend.id);
      Toast.show({
        type: "success",
        text1: t("friends.deleteSuccess"),
      });
    } catch (error) {
      handleError(error, {
        message: "Error deleting friend",
        route: "/api/friend/delete-friend",
        method: "DELETE",
      });
      Toast.show({
        type: "error",
        text1: t("friends.deleteError"),
      });
    }
  };

  const imageSource = friend.user.profile_picture
    ? { uri: friend.user.profile_picture }
    : require("@/assets/images/default-avatar.png");

  return (
    <View className="bg-slate-900 p-4 rounded-md shadow-md flex-row items-center justify-between">
      <View className="flex-row items-center gap-5">
        <Image
          source={imageSource}
          className="rounded-full border-2 border-blue-500 w-[40px] h-[40px]"
        />
        <AppText className="text-lg">{friend.user.display_name}</AppText>
      </View>
      <AnimatedButton
        onPress={handleDeleteFriend}
        className="bg-red-600 p-2 rounded-md"
      >
        <Trash2 color="#f3f4f6" size={20} />
      </AnimatedButton>
    </View>
  );
}
