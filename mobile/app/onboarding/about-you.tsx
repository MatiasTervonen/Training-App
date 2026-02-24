import {
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
} from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingProgressBar from "@/features/onboarding/OnboardingProgressBar";
import SkipOnboardingButton from "@/features/onboarding/SkipOnboardingButton";
import { useSkipOnboarding } from "@/features/onboarding/useSkipOnboarding";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";

export default function AboutYouScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation("onboarding");
  const { skipOnboarding } = useSkipOnboarding();

  const currentUnit = useUserStore(
    (state) => state.profile?.weight_unit ?? (i18n.language === "fi" ? "kg" : "lbs"),
  );

  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">(
    currentUnit === "lbs" ? "lbs" : "kg",
  );

  const handleContinue = () => {
    if (weight) {
      const numWeight = parseFloat(weight);
      const minWeight = unit === "kg" ? 30 : 66;
      const maxWeight = unit === "kg" ? 300 : 660;

      if (!isNaN(numWeight) && numWeight >= minWeight && numWeight <= maxWeight) {
        useUserStore.getState().setUserProfile({ weight_unit: unit });
      }
    }
    router.push("/onboarding/complete");
  };

  const handleSkipStep = () => {
    router.push("/onboarding/complete");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Pressable className="flex-1 px-6 justify-center" onPress={Keyboard.dismiss}>
        <OnboardingProgressBar currentStep={3} />

        <View className="mt-8">
          <AppText className="text-3xl text-center mb-4">
            {t("aboutYou.title")}
          </AppText>
          <BodyText className="text-center text-base mb-8">
            {t("aboutYou.description")}
          </BodyText>
        </View>

        {/* Unit toggle */}
        <View className="flex-row justify-center mb-6 gap-3">
          <AnimatedButton
            onPress={() => setUnit("kg")}
            className={`px-6 py-2 rounded-lg border-2 ${
              unit === "kg"
                ? "bg-blue-900/40 border-blue-500"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            <AppText className={unit === "kg" ? "text-blue-400" : "text-slate-400"}>
              kg
            </AppText>
          </AnimatedButton>
          <AnimatedButton
            onPress={() => setUnit("lbs")}
            className={`px-6 py-2 rounded-lg border-2 ${
              unit === "lbs"
                ? "bg-blue-900/40 border-blue-500"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            <AppText
              className={unit === "lbs" ? "text-blue-400" : "text-slate-400"}
            >
              lbs
            </AppText>
          </AnimatedButton>
        </View>

        {/* Weight input */}
        <View className="flex-row items-center justify-center mb-8">
          <TextInput
            value={weight}
            onChangeText={(text) => {
              // Only allow numbers and a single decimal point
              const filtered = text.replace(/[^0-9.]/g, "");
              const parts = filtered.split(".");
              if (parts.length <= 2) {
                setWeight(parts.length === 2 ? `${parts[0]}.${parts[1]}` : filtered);
              }
            }}
            placeholder="0"
            placeholderTextColor="#64748b"
            keyboardType="decimal-pad"
            className="bg-slate-800 border-2 border-slate-700 rounded-lg text-center text-gray-100 text-3xl py-3 px-6 w-40 font-russo"
            maxLength={6}
          />
          <AppText className="text-2xl ml-3 text-slate-400">{unit}</AppText>
        </View>

        <AnimatedButton
          onPress={handleContinue}
          className="btn-base py-3"
          label={t("aboutYou.continue")}
          textClassName="text-lg"
        />

        <View className="items-center mt-4">
          <AnimatedButton onPress={handleSkipStep} className="py-2 px-4">
            <AppText className="text-slate-400 text-sm underline">
              {t("aboutYou.skipStep")}
            </AppText>
          </AnimatedButton>
        </View>

        <SkipOnboardingButton onSkip={skipOnboarding} />
      </Pressable>
    </KeyboardAvoidingView>
  );
}
