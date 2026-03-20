import { View } from "react-native";
import { Image } from "expo-image";
import OnboardingProgressBar from "@/features/onboarding/OnboardingProgressBar";
import OnboardingBackButton from "@/features/onboarding/OnboardingBackButton";

type Props = {
  currentStep: number;
  showBackButton?: boolean;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export default function OnboardingLayout({
  currentStep,
  showBackButton = true,
  children,
  footer,
}: Props) {
  return (
    <View className="flex-1 px-6">
      {showBackButton && <OnboardingBackButton />}

      <View className="items-center pt-14 pb-2">
        <Image
          source={require("@/assets/images/app-logos/kurvi_ice_blue_final_copnverted.png")}
          className="w-40 h-14"
          contentFit="contain"
        />
      </View>

      <OnboardingProgressBar currentStep={currentStep} />

      <View className="flex-1 justify-center">{children}</View>

      <View className="pb-6">{footer}</View>
    </View>
  );
}
