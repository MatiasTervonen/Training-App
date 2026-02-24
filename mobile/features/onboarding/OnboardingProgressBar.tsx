import { View } from "react-native";

type Props = {
  currentStep: number;
  totalSteps?: number;
};

export default function OnboardingProgressBar({
  currentStep,
  totalSteps = 5,
}: Props) {
  return (
    <View className="flex-row justify-center items-center gap-2 py-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full ${
            index === currentStep
              ? "w-8 bg-blue-500"
              : index < currentStep
                ? "w-2 bg-blue-400"
                : "w-2 bg-slate-600"
          }`}
        />
      ))}
    </View>
  );
}
