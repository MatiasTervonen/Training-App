import { View, ScrollView, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import FriendRequestForm from "@/features/friends/FriendRequestForm";
import FriendCard from "@/features/friends/FriendCard";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useFriends } from "@/features/friends/hooks/useFriends";
import { useFriendRequests } from "@/features/friends/hooks/useFriendRequests";
import { useAcceptFriendRequest } from "@/features/friends/hooks/useAcceptFriendRequest";
import { useRejectFriendRequest } from "@/features/friends/hooks/useRejectFriendRequest";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { handleError } from "@/utils/handleError";
import { Users } from "lucide-react-native";
import PageContainer from "@/components/PageContainer";
import AppTextNC from "@/components/AppTextNC";

export default function FriendsScreen() {
  const { t } = useTranslation("friends");
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: requests, isLoading: requestsLoading } = useFriendRequests();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();

  const handleAccept = async (senderId: string) => {
    try {
      await acceptRequest.mutateAsync(senderId);
      Toast.show({
        type: "success",
        text1: t("friends.acceptSuccess"),
      });
    } catch (error) {
      handleError(error, {
        message: "Error accepting friend request",
        route: "/api/friend/accept",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: t("friends.acceptError"),
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest.mutateAsync(requestId);
      Toast.show({
        type: "success",
        text1: t("friends.rejectSuccess"),
      });
    } catch (error) {
      handleError(error, {
        message: "Error rejecting friend request",
        route: "/api/friend/reject",
        method: "DELETE",
      });
      Toast.show({
        type: "error",
        text1: t("friends.rejectError"),
      });
    }
  };

  const isLoading = friendsLoading || requestsLoading;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName=" grow"
      keyboardShouldPersistTaps="handled"
    >
      <PageContainer>
        <FriendRequestForm />

        {isLoading ? (
          <ActivityIndicator className="mt-10" color="#3b82f6" size="large" />
        ) : (
          <>
            {requests && requests.length > 0 && (
              <View className="mt-5 rounded-md shadow-md bg-slate-950 border-slate-800 border-[1.5px] mb-5">
                <View className="items-center justify-center mt-5 mb-5">
                  <AppText className="text-lg">
                    {t("friends.pendingRequests")}
                  </AppText>
                </View>
                {requests.map((request) => (
                  <View
                    key={request.id}
                    className="bg-slate-900 p-4 rounded-md shadow-md mb-3"
                  >
                    <AppText className="mb-3">
                      {request.sender.display_name}
                    </AppText>
                    <View className="flex-row gap-3">
                      <AnimatedButton
                        className="btn-base flex-1 py-1.5 px-8"
                        label={t("friends.accept")}
                        onPress={() => handleAccept(request.sender_id)}
                        disabled={acceptRequest.isPending}
                      />
                      <AnimatedButton
                        className="btn-danger flex-1 py-1.5 px-8"
                        label={t("friends.reject")}
                        onPress={() => handleReject(request.id)}
                        disabled={rejectRequest.isPending}
                      />
                    </View>
                  </View>
                ))}
                <View className="mb-3" />
              </View>
            )}

            <View className="mt-5 px-2 rounded-md shadow-md bg-slate-950 border-slate-800 border-[1.5px] flex-1">
              <View className="items-center justify-center mt-5 mb-10">
                <AppText className="text-xl">{t("friends.myFriends")}</AppText>
              </View>
              {friends && friends.length > 0 ? (
                friends.map((friend) => (
                  <View key={friend.id} className="mb-3 w-full">
                    <FriendCard friend={friend} />
                  </View>
                ))
              ) : (
                <View className="items-center my-6 px-4">
                  <View className="items-center">
                    <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
                      <Users size={36} color="#94a3b8" />
                    </View>
                    <AppText className="text-lg text-center mb-3">
                      {t("friends.noFriends")}
                    </AppText>
                    <AppTextNC className="text-sm text-gray-400 text-center leading-5">
                      {t("friends.noFriendsDesc")}
                    </AppTextNC>
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </PageContainer>
    </ScrollView>
  );
}
