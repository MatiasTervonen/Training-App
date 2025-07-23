import AppText from "./components/AppText";
import { View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GradientColorText from "./components/GradientColorText";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import AppButton from "./components/button";
import Screen from "./components/Screen";

const screenWidth = Dimensions.get("window").width;
const width = screenWidth - 130; // Adjusting for padding
const aspectRatio = 2047 / 1106;
const height = width * aspectRatio;

export default function Index() {
  const router = useRouter();

  return (
    <Screen>
      <LinearGradient
        colors={["#0f172a", "#0f172a", "#1e3a8a"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1, alignItems: "center" }}
        className="justify-between items-center h-full w-full "
      >
        <View className="items-center justify-center mt-10">
          <AppText className="text-4xl">Welcome to the</AppText>
          <GradientColorText style={{ width: 200, height: 50 }}>
            MyTrack!
          </GradientColorText>
          <AppText className="text-lg mt-4">
            The Only Tracking App You&apos;ll Ever Need
          </AppText>
          <Image
            source={require("../assets/images/frontpage-new.png")}
            style={{ width, height }}
            contentFit="cover"
          />
        </View>
        <View className="mb-10">
          <AppButton
            title="Log in / Sign up"
            onPress={() => router.push("./login")}
          />
        </View>
      </LinearGradient>
    </Screen>
  );
}
