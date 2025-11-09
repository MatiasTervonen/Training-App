import AppText from "@/components/AppText";
import { View, Dimensions, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GradientColorText from "@/components/GradientColorText";
import { Image } from "expo-image";
import GradientButton from "@/components/buttons/GradientButton";
import { useRouter } from "expo-router";
import PageContainer from "@/components/PageContainer";


export default function Index() {
  const router = useRouter();

  const screenWidth = Dimensions.get("window").width;
  const maxWidth = 250;
  const width = Math.min(screenWidth - 130, maxWidth);
  const aspectRatio = 2047 / 1106;
  const height = width * aspectRatio;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <LinearGradient
        colors={["#0f172a", "#0f172a", "#1e3a8a"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      >
        <PageContainer className="justify-between items-center">
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
          <View className="mb-10 w-full px-14">
            <GradientButton
              label="Log in / Sign up"
              onPress={() => router.push("/login")}
            />
          </View>
        </PageContainer>
      </LinearGradient>
    </ScrollView>
  );
}
