import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function OnboardingBackButton() {
  const router = useRouter();

  return (
    <View className="absolute top-12 left-6 z-10">
      <AnimatedButton onPress={() => router.back()} hitSlop={10}>
        <ArrowLeft color="#94a3b8" size={24} />
      </AnimatedButton>
    </View>
  );
}
