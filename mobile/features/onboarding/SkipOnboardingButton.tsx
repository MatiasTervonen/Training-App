import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppText from "@/components/AppText";
import { useTranslation } from "react-i18next";

type Props = {
  onSkip: () => void;
};

export default function SkipOnboardingButton({ onSkip }: Props) {
  const { t } = useTranslation("onboarding");

  return (
    <View className="items-center mt-4">
      <AnimatedButton onPress={onSkip} className="py-2 px-4">
        <AppText className="text-slate-400 text-sm underline">
          {t("skip")}
        </AppText>
      </AnimatedButton>
    </View>
  );
}
