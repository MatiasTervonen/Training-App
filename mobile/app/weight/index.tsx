import LinkButton from "@/components/LinkButton";
import AppText from "@/components/AppText";
import { View } from "react-native";

export default function WeightScreen() {
  return (
    <View className="px-5 max-w-md mx-auto w-full">
      <AppText className="my-5 text-center text-2xl">Weight Tracking</AppText>
      <View>
        <LinkButton href="/weight/tracking" label="Tracking" />
        <LinkButton href="/weight/analytics" label="Analytics" />
      </View>
    </View>
  );
}
