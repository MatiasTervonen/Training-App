import {
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  ScrollView,
} from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingProgressBar from "@/features/onboarding/OnboardingProgressBar";
import SkipOnboardingButton from "@/features/onboarding/SkipOnboardingButton";
import OnboardingBackButton from "@/features/onboarding/OnboardingBackButton";
import { useSkipOnboarding } from "@/features/onboarding/useSkipOnboarding";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";
import { supabase } from "@/lib/supabase";

export default function AboutYouScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation("onboarding");
  const { skipOnboarding } = useSkipOnboarding();

  const currentUnit = useUserStore(
    (state) => state.profile?.weight_unit ?? (i18n.language === "fi" ? "kg" : "lbs"),
  );
  const currentDistanceUnit = useUserStore(
    (state) => state.profile?.distance_unit ?? (i18n.language === "fi" ? "km" : "mi"),
  );

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">(
    currentUnit === "lbs" ? "lbs" : "kg",
  );
  const [distanceUnit, setDistanceUnit] = useState<"km" | "mi">(
    currentDistanceUnit === "mi" ? "mi" : "km",
  );

  const handleContinue = () => {
    const profileUpdates: Record<string, string | number | null> = {
      weight_unit: unit,
      distance_unit: distanceUnit,
    };

    if (height) {
      const numHeight = parseFloat(height);
      if (!isNaN(numHeight) && numHeight >= 50 && numHeight <= 300) {
        profileUpdates.height_cm = numHeight;
      }
    }

    if (weight) {
      const numWeight = parseFloat(weight);
      const minWeight = unit === "kg" ? 30 : 66;
      const maxWeight = unit === "kg" ? 300 : 660;

      if (!isNaN(numWeight) && numWeight >= minWeight && numWeight <= maxWeight) {
        supabase
          .rpc("weight_save_weight", {
            p_title: t("aboutYou.startingWeight"),
            p_notes: "",
            p_weight: numWeight,
          })
          .then();
      }
    }

    useUserStore.getState().setUserProfile(profileUpdates);
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
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <OnboardingBackButton />
        <OnboardingProgressBar currentStep={4} />

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

        {/* Height input */}
        <AppText className="text-xl text-center mb-4">
          {t("aboutYou.heightLabel")}
        </AppText>
        <View className="flex-row items-center justify-center mb-8">
          <TextInput
            value={height}
            onChangeText={(text) => {
              const filtered = text.replace(/[^0-9]/g, "");
              setHeight(filtered);
            }}
            placeholder="0"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            className="bg-slate-800 border-2 border-slate-700 rounded-lg text-center text-gray-100 text-3xl py-3 px-6 w-40 font-russo"
            maxLength={3}
          />
          <AppText className="text-2xl ml-3 text-slate-400">cm</AppText>
        </View>

        {/* Distance unit */}
        <AppText className="text-xl text-center mb-4">
          {t("aboutYou.distanceUnit")}
        </AppText>
        <View className="flex-row justify-center mb-8 gap-3">
          <AnimatedButton
            onPress={() => setDistanceUnit("km")}
            className={`px-6 py-2 rounded-lg border-2 ${
              distanceUnit === "km"
                ? "bg-blue-900/40 border-blue-500"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            <AppText
              className={distanceUnit === "km" ? "text-blue-400" : "text-slate-400"}
            >
              km
            </AppText>
          </AnimatedButton>
          <AnimatedButton
            onPress={() => setDistanceUnit("mi")}
            className={`px-6 py-2 rounded-lg border-2 ${
              distanceUnit === "mi"
                ? "bg-blue-900/40 border-blue-500"
                : "bg-slate-800 border-slate-700"
            }`}
          >
            <AppText
              className={distanceUnit === "mi" ? "text-blue-400" : "text-slate-400"}
            >
              mi
            </AppText>
          </AnimatedButton>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
