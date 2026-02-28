import { View, Keyboard, ScrollView, ActivityIndicator, Pressable } from "react-native";
import AppText from "@/components/AppText";
import FriendRequestForm from "@/features/friends/FriendRequestForm";
import FriendCard from "@/features/friends/FriendCard";
import ModalPageWrapper from "@/components/ModalPageWrapper";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useFriends } from "@/features/friends/hooks/useFriends";
import { useFriendRequests } from "@/features/friends/hooks/useFriendRequests";
import { useAcceptFriendRequest } from "@/features/friends/hooks/useAcceptFriendRequest";
import { useRejectFriendRequest } from "@/features/friends/hooks/useRejectFriendRequest";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { handleError } from "@/utils/handleError";

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
    <ModalPageWrapper>
      <Pressable onPress={Keyboard.dismiss} className="flex-1">
        <ScrollView
          className="flex-1 w-full px-5 pt-5 pb-10"
          contentContainerClassName="max-w-md mx-auto w-full grow"
          keyboardShouldPersistTaps="handled"
        >
          <AppText className="text-2xl text-center mb-10">
            {t("friends.title")}
          </AppText>

          <FriendRequestForm />

          {isLoading ? (
            <ActivityIndicator className="mt-10" color="#3b82f6" size="large" />
          ) : (
            <>
              {requests && requests.length > 0 && (
                <View className="mt-5 px-4 rounded-md shadow-md bg-slate-950 border-slate-700 border-2 mb-5">
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
                          className="btn-base flex-1 py-2 px-8"
                          label={t("friends.accept")}
                          onPress={() => handleAccept(request.sender_id)}
                          textClassName="text-gray-100 text-center"
                          disabled={acceptRequest.isPending}
                        />
                        <AnimatedButton
                          className="btn-danger flex-1 py-2 px-8"
                          label={t("friends.reject")}
                          onPress={() => handleReject(request.id)}
                          textClassName="text-gray-100 text-center"
                          disabled={rejectRequest.isPending}
                        />
                      </View>
                    </View>
                  ))}
                  <View className="mb-3" />
                </View>
              )}

              <View className="mt-5 px-2 rounded-md shadow-md bg-slate-950 border-slate-700 border-2 flex-1">
                <View className="items-center justify-center mt-5 mb-10">
                  <AppText className="text-2xl">
                    {t("friends.myFriends")}
                  </AppText>
                </View>
                {friends && friends.length > 0 ? (
                  friends.map((friend) => (
                    <View key={friend.id} className="mb-3 w-full">
                      <FriendCard friend={friend} />
                    </View>
                  ))
                ) : (
                  <AppText className="text-gray-400 text-center mb-10">
                    {t("friends.noFriends")}
                  </AppText>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </Pressable>
    </ModalPageWrapper>
  );
}
