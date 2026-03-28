import { View, TextInput, Keyboard } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Image } from "expo-image";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import OnboardingProgressBar from "@/features/onboarding/OnboardingProgressBar";
import OnboardingBackButton from "@/features/onboarding/OnboardingBackButton";
import SkipOnboardingButton from "@/features/onboarding/SkipOnboardingButton";
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
    (state) =>
      state.profile?.weight_unit ?? (i18n.language === "fi" ? "kg" : "lbs"),
  );
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const topPadding =
    containerHeight > 0 && contentHeight > 0
      ? Math.max(0, (containerHeight - contentHeight) / 2)
      : 0;

  const [unit, setUnit] = useState<"kg" | "lbs">(
    currentUnit === "lbs" ? "lbs" : "kg",
  );
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">(
    i18n.language === "fi" ? "cm" : "ft",
  );

  const handleContinue = async () => {
    const profileUpdates: Record<string, string | number | null> = {
      weight_unit: unit,
    };

    if (heightUnit === "ft") {
      const ft = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      if (ft > 0 && inches <= 11) {
        const cm = Math.round((ft * 12 + inches) * 2.54);
        if (cm >= 50 && cm <= 300) {
          profileUpdates.height_cm = cm;
        }
      }
    } else if (height) {
      const numHeight = parseFloat(height);
      if (!isNaN(numHeight) && numHeight >= 50 && numHeight <= 300) {
        profileUpdates.height_cm = numHeight;
      }
    }

    if (weight) {
      const numWeight = parseFloat(weight);
      const minWeight = unit === "kg" ? 30 : 66;
      const maxWeight = unit === "kg" ? 300 : 660;

      if (
        !isNaN(numWeight) &&
        numWeight >= minWeight &&
        numWeight <= maxWeight
      ) {
        const today = new Date().toLocaleDateString("en-CA");
        const { data: existing } = await supabase
          .from("weight")
          .select("id")
          .gte("created_at", `${today}T00:00:00`)
          .lt("created_at", `${today}T23:59:59`)
          .limit(1);

        if (!existing || existing.length === 0) {
          const { error } = await supabase.rpc("weight_save_weight", {
            p_title: t("aboutYou.startingWeight"),
            p_notes: "",
            p_weight: numWeight,
          });
          if (error) {
            console.error("Failed to save starting weight:", error);
          }
        }
      }
    }

    useUserStore.getState().setUserProfile(profileUpdates);
    router.push("/onboarding/preferences");
  };

  return (
    <View className="flex-1" onTouchStart={Keyboard.dismiss}>
      <View className="flex-1 px-6">
        <OnboardingBackButton />

        <View className="items-center pt-14 pb-2">
          <Image
            source={require("@/assets/images/app-logos/kurvi_ice_blue_final_copnverted.png")}
            className="w-40 h-14"
            contentFit="contain"
          />
        </View>

        <OnboardingProgressBar currentStep={4} />

        <KeyboardAwareScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
        >
          <View style={{ paddingTop: topPadding, opacity: containerHeight > 0 && contentHeight > 0 ? 1 : 0 }}>
            <View onLayout={(e) => {
              if (contentHeight === 0) setContentHeight(e.nativeEvent.layout.height);
            }}>
            <AppText className="text-2xl text-center mb-2">
              {t("aboutYou.title")}
            </AppText>
            <BodyText className="text-center mb-6">
              {t("aboutYou.description")}
            </BodyText>

            {/* Weight section */}
            <AppText className="text-lg text-center mb-3">
              {t("aboutYou.weightTitle")}
            </AppText>
            <View className="flex-row justify-center mb-4 gap-3">
              <AnimatedButton
                onPress={() => setUnit("kg")}
                className={`w-20 py-2 rounded-lg border-[1.5px] items-center ${
                  unit === "kg"
                    ? "bg-blue-900/40 border-blue-500"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <AppText
                  className={unit === "kg" ? "text-blue-400" : "text-slate-400"}
                >
                  kg
                </AppText>
              </AnimatedButton>
              <AnimatedButton
                onPress={() => setUnit("lbs")}
                className={`w-20 py-2 rounded-lg border-[1.5px] items-center ${
                  unit === "lbs"
                    ? "bg-blue-900/40 border-blue-500"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <AppText
                  className={
                    unit === "lbs" ? "text-blue-400" : "text-slate-400"
                  }
                >
                  lbs
                </AppText>
              </AnimatedButton>
            </View>

            {/* Weight input */}
            <View className="flex-row items-center justify-center mb-6">
              <TextInput
                value={weight}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^0-9.]/g, "");
                  const parts = filtered.split(".");
                  if (parts.length <= 2) {
                    setWeight(
                      parts.length === 2 ? `${parts[0]}.${parts[1]}` : filtered,
                    );
                  }
                }}
                placeholder="0"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
                className="bg-slate-800 border-[1.5px] border-slate-700 rounded-lg text-center text-gray-100 text-2xl py-2 px-4 w-36 font-russo"
                maxLength={6}
              />
              <AppText className="text-xl ml-3 text-slate-400 w-10">
                {unit}
              </AppText>
            </View>

            {/* Height section */}
            <AppText className="text-lg text-center mb-3">
              {t("aboutYou.heightTitle")}
            </AppText>
            <View className="flex-row justify-center mb-4 gap-3">
              <AnimatedButton
                onPress={() => setHeightUnit("cm")}
                className={`w-20 py-2 rounded-lg border-[1.5px] items-center ${
                  heightUnit === "cm"
                    ? "bg-blue-900/40 border-blue-500"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <AppText
                  className={
                    heightUnit === "cm" ? "text-blue-400" : "text-slate-400"
                  }
                >
                  cm
                </AppText>
              </AnimatedButton>
              <AnimatedButton
                onPress={() => setHeightUnit("ft")}
                className={`w-20 py-2 rounded-lg border-[1.5px] items-center ${
                  heightUnit === "ft"
                    ? "bg-blue-900/40 border-blue-500"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <AppText
                  className={
                    heightUnit === "ft" ? "text-blue-400" : "text-slate-400"
                  }
                >
                  ft
                </AppText>
              </AnimatedButton>
            </View>

            {/* Height input */}
            {heightUnit === "ft" ? (
              <View className="mb-6">
                <View className="flex-row justify-center gap-4">
                  <View className="flex-row items-center">
                    <TextInput
                      value={heightFt}
                      onChangeText={(text) =>
                        setHeightFt(text.replace(/[^0-9]/g, ""))
                      }
                      placeholder={t("aboutYou.heightFtPlaceholder")}
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      className="bg-slate-800 border-[1.5px] border-slate-700 rounded-lg text-center text-gray-100 text-2xl py-2 px-4 w-20 font-russo"
                      maxLength={1}
                    />
                    <AppText className="text-xl ml-2 text-slate-400">
                      ft
                    </AppText>
                  </View>
                  <View className="flex-row items-center">
                    <TextInput
                      value={heightIn}
                      onChangeText={(text) =>
                        setHeightIn(text.replace(/[^0-9]/g, ""))
                      }
                      placeholder={t("aboutYou.heightInPlaceholder")}
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      className="bg-slate-800 border-[1.5px] border-slate-700 rounded-lg text-center text-gray-100 text-2xl py-2 px-4 w-20 font-russo"
                      maxLength={2}
                    />
                    <AppText className="text-xl ml-2 text-slate-400">
                      in
                    </AppText>
                  </View>
                </View>
              </View>
            ) : (
              <View className="flex-row items-center justify-center mb-6">
                <TextInput
                  value={height}
                  onChangeText={(text) =>
                    setHeight(text.replace(/[^0-9]/g, ""))
                  }
                  placeholder="0"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                  className="bg-slate-800 border-[1.5px] border-slate-700 rounded-lg text-center text-gray-100 text-2xl py-2 px-4 w-36 font-russo"
                  maxLength={3}
                />
                <AppText className="text-xl ml-3 text-slate-400">cm</AppText>
              </View>
            )}

            </View>
          </View>
        </KeyboardAwareScrollView>

        <View className="pb-6">
          <AnimatedButton
            onPress={handleContinue}
            className="btn-base py-3"
            label={t("aboutYou.continue")}
            textClassName="text-lg"
          />
          <SkipOnboardingButton onSkip={skipOnboarding} />
        </View>
      </View>
    </View>
  );
}
