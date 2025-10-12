import AppText from "@/components/AppText";
import { View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GradientColorText from "@/components/GradientColorText";
import { Image } from "expo-image";
import GradientButton from "@/components/GradientButton";
import { useRouter } from "expo-router";

const screenWidth = Dimensions.get("window").width;
const width = screenWidth - 130; // Adjusting for padding
const aspectRatio = 2047 / 1106;
const height = width * aspectRatio;

export default function Index() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#0f172a", "#0f172a", "#1e3a8a"]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={{ flex: 1, alignItems: "center" }}
      className="justify-between items-center h-full w-full"
    >
      <View className="items-center justify-center mt-10">
        <AppText className="text-4xl">Welcome to the</AppText>
        <GradientColorText style={{ width: 200, height: 50 }}>
          MyTrack!
        </GradientColorText>
        <AppText className="text-xl mt-4">
          The Only Tracking App You&apos;ll Ever Need
        </AppText>
      </View>
      <Image
        source={require("../assets/images/frontpage-new.png")}
        style={{ width, height }}
        contentFit="cover"
      />
      <View className="mb-14 w-full px-14">
        <GradientButton
          label="Log in / Sign up"
          onPress={() => router.push("/login")}
        />
      </View>
    </LinearGradient>
  );
}
