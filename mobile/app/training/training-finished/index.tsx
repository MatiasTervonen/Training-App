import { View } from "react-native";
import AppText from "@/components/AppText";
import { Image } from "expo-image";
import LinkButton from "@/components/LinkButton";

export default function TrainingFinishedScreen() {
  return (
    <View className="px-5 max-w-md mx-auto w-full">
      <View className="flex-row gap-5 items-center justify-center mt-10">
        <AppText className="text-2xl">Workout Finished</AppText>
        <Image
          source={require("@/assets/images/confetti.png")}
          className="w-10 h-10"
        />
      </View>
      <View className="mt-10 w-2/3 mx-auto">
        <LinkButton href="/dashboard">
          <AppText className="text-center">Done</AppText>
        </LinkButton>
      </View>
    </View>
  );
}
