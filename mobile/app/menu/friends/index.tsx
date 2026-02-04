import { View } from "react-native";
import AppText from "@/components/AppText";
import FriendRequestForm from "@/features/friends/FriendRequestForm";
import FriendCard from "@/features/friends/FriendCard";
import { Friends } from "@/types/models";
import PageContainer from "@/components/PageContainer";

export default function FriendsScreen() {
  // Tankstak query  to fetch friends from the backend like SWR in web/ use persistence  ?????

  return (
    <PageContainer>
      <AppText className="text-6xl text-center">Friends</AppText>
      <FriendRequestForm />
      <View className="flex flex-col w-full">
        {Friends.map((friend) => (
          <FriendCard key={friend.id} friend={friend} />
        ))}
      </View>
    </PageContainer>
  );
}
